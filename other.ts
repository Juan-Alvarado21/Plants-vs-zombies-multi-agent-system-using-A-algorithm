interface Punto {
	x: number;
	y: number;
}

enum Tipos {
	vacio,
	pared,
	nave,
	muestra,
	agente,
	migaja
}

enum Modos {
	corriendo,
	pared,
	muestra,
	nave,
	detenido,
	migaja
}

function randint(min:number, max:number):number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distMan(p1:Punto,p2:Punto):number {
	let pi1 = puntoAInt(p1);
	let pi2 = puntoAInt(p2);

	return Math.abs(pi1.x-pi2.x) + Math.abs(pi1.y-pi2.y);
}

function puntoAInt(p: Punto) : Punto {
	return {x : Math.floor(p.x), y : Math.floor(p.y)};
}

var todAgentes: Agente[] = [];
var usarEstrella:boolean = true;
var usarMigajas:boolean = false;

function distManhattan(p:Punto):number {
	return Math.abs(tab.navePos.x - p.x) + Math.abs(tab.navePos.y - p.y)
}

class Agente {
	pos: Punto;
	cargando: boolean;
	movsPendientes: Punto[] = [];
	constructor(pos: Punto) {
		this.pos = pos;
		this.cargando = false;
		todAgentes.push(this);
	}

	moverA(pos:Punto) {
		this.pos = pos;
	}
	mover() {
		// Si existe una muestra en el nodo actual, lo agarra.
		let nodoActual:Nodo|null = tab.getNodo(this.pos);
		if(nodoActual!==null) {
		   if(nodoActual.tipo === Tipos.muestra && !this.cargando) {
			   this.cargando = true;
			   nodoActual.tipo = Tipos.vacio;
		   }
		}

		if(!this.cargando) {
			let puntos:Punto[] = tab.getMovs(this.pos);
			let tienenMigaja:Nodo[] = [];
			for(let i=0;i<puntos.length;i++) {
				let n:Nodo|null = tab.getNodo(puntos[i]);
				if(n!==null) {
					if(n.tipo === Tipos.migaja) {
						tienenMigaja.push(n);
					}
				} else {
					console.log("Error al obtener los movs alrededor.");
				}
			}
			if(tienenMigaja.length !== 0) {
				// Va a ir al migaja más lejano a la nave.
				let max:Nodo = tienenMigaja[0];
				for(let i=1;i<tienenMigaja.length;i++) {
					if(distManhattan(tienenMigaja[i].pos) > distManhattan(max.pos)) {
						max = tienenMigaja[i];
					}
				}
				max.quitarMigaja();
				this.moverA(max.pos);
			} else {
				// Movimiento aleatorio
				this.moverA(puntos[randint(0,puntos.length-1)]);
			}
		} else {
			if(nodoActual?.tipo === Tipos.nave) {
				this.cargando = false;
			} else {
				// Regresar con a-estrella o manhattan
				if(!usarEstrella) {
				// manhattan
					let movs:Punto[] = tab.getMovs(this.pos);
					let min:Punto = movs[0];
					for(let i=1;i<movs.length;i++) {
						if(distManhattan(min) > distManhattan(movs[i])) {
							min = movs[i];
						}
					}
					nodoActual?.agregarMigaja();
					this.moverA(min);
				} else {
					// Nodo origen: El mismo nodo
					// Nodo objetivo: El nodo de nave

					let origen:Nodo = tab.getNodo(this.pos)!;
					let destino:Nodo = tab.getNodo(tab.navePos)!;

					if(this.movsPendientes.length!==0) {
						this.moverA(this.movsPendientes[this.movsPendientes.length-1]);
						this.movsPendientes.pop();
						// Se mueve al último elemento el listado, y lo quita.
					} else {
						let sinExplorar:Nodo[] = [];
						let precedente = new Map<Nodo,Nodo>();
						let costos = new Map<Nodo,number>();
						let existe = new Map<Nodo,boolean>(); // Si existe en sinExplorar
						costos.set(origen,0);

						let f = new Map<Nodo,number>(); // De la formula f(n) = c(n) + h(n)
						f.set(origen, costos.get(origen)! + distManhattan(origen.pos));

						sinExplorar.push(origen);
						existe.set(origen,true);

						while(sinExplorar.length!==0) {
							// Obtiene el mínimo valor de f
							let n:Nodo = sinExplorar[0];
							let min:number = f.get(n)!; // Revisar si es cierto
							let posN:number = 0;
							for(let i=1;i<sinExplorar.length;i++) {
								if(f.get(sinExplorar[i])! < min) {
									n = sinExplorar[i];
									min = f.get(sinExplorar[i])!;
									posN = i;
								}
							}

							if(n===destino) {
								let iterator:Nodo = destino;
								while(iterator!==origen) {
									this.movsPendientes.push(iterator.pos);
									iterator = precedente.get(iterator)!;
								}
								break;
							}

							// quitar nodo
							sinExplorar.splice(posN, 1);
							existe.set(n, false);

							let vecinos:Nodo[] = [];
							let lugares:Punto[] = tab.getMovs(n.pos);
							for(let i=0;i<lugares.length;i++) {
								vecinos.push(tab.getNodo(lugares[i])!);

								let cTemp:number = costos.get(n)! + 1;
								let menorQue:boolean = false;
								if(costos.get(vecinos[i]) === undefined) {
									menorQue = true;
								} else if (costos.get(vecinos[i])! > cTemp) { 
									menorQue = true;
								}

								if(menorQue) {
									precedente.set(vecinos[i], n);
									costos.set(vecinos[i],cTemp);
									f.set(vecinos[i], cTemp + distManhattan(vecinos[i].pos));
									if(existe.get(vecinos[i]) === undefined) {
										sinExplorar.push(vecinos[i]);
									} else if (existe.get(vecinos[i]) === false) {
										sinExplorar.push(vecinos[i]);
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

class Nodo {
	tipo: Tipos;
	migajas: number = 0;
	vacio: boolean;
	pos: Punto;
	agentes: Set<Agente>;
	constructor(tipo: Tipos, pos: Punto) {
		this.pos = puntoAInt(pos);
		this.tipo = tipo;
		this.migajas = 0;
		this.vacio = this.tipo === Tipos.vacio;
	}

	tieneMigajas(): boolean{
		return this.migajas>0;
	}

	quitarMigaja(): boolean {
		if(this.tipo === Tipos.migaja && this.migajas>0) {
			this.migajas--;
			if(this.migajas === 0) {
				this.tipo = Tipos.vacio;
			}
			return true;
		} else {
			return false;
		}
	}

	agregarMigaja(): boolean {
		if(this.tipo === Tipos.migaja) {
			this.migajas++;
			return true;
		} else if (this.tipo === Tipos.vacio) {
			this.tipo = Tipos.migaja;
			this.migajas = 1;
			return true;
		} else {
			return false;
		}
	}
}

class Tablero {
	tamX: number;
	tamY: number;
	dim: Punto;
	nodos: Nodo[][];
	navePos: Punto;

	constructor(dim: Punto) {
		this.dim = puntoAInt(dim);
		this.tamX = this.dim.x;
		this.tamY = this.dim.y;

		this.nodos = [];

		// Inicializa el matriz de nodos en 0
		for(let i=0;i<this.tamY;i++) {
			var fila:Nodo[] = [];
			for(let j=0;j<this.tamX;j++) {
				fila.push(new Nodo(Tipos.vacio, {y:i, x:j}));
			}
			this.nodos.push([...fila]);
		}

		this.navePos = {x:1,y:1}; // No tener un tablero menor a 2x2
		this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.nave;
	}

	conmutar(t:Tipos, p:Punto) {
		var n:Nodo = this.nodos[p.y][p.x];

		if(t !== Tipos.nave)  {
			if(n.tipo === t && n.tipo !== Tipos.vacio) {
				n.tipo = Tipos.vacio;
			} else if (n.tipo == Tipos.vacio) {
				n.tipo = t;
				if(Tipos.migaja === t) {
					n.agregarMigaja();
				}
			}
		} else {
			if(n.tipo===Tipos.vacio){
				this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.vacio;
				this.navePos = p;
				this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.nave;
			}
		}

	}

	enTabla(p:Punto) : boolean{
		var pInt = puntoAInt(p);
		if(pInt.x>=0 && pInt.x < this.tamX) {
			if(pInt.y>=0 && pInt.y < this.tamY) {
				return true;
			}
		}
		return false;
	}

	getMovs(p:Punto):Punto[]  {
		var posPuntos:Punto[];
		var ret:Punto[] = [];
		var pInt = puntoAInt(p);

		if(this.enTabla(pInt)) {
			posPuntos = [
				{x:pInt.x-1,y:pInt.y},
				{x:pInt.x+1,y:pInt.y},
				{x:pInt.x,y:pInt.y-1},
				{x:pInt.x,y:pInt.y+1}
			]

			for(let i=0;i<posPuntos.length;i++) {
				if(this.enTabla(posPuntos[i]) && tab.getNodo(posPuntos[i])?.tipo!==Tipos.pared) {
					ret.push(posPuntos[i]);
				}
			}
		}

		return ret;
	}

	getNodo(p:Punto):Nodo|null {
		if(this.enTabla(p)) {
			return this.nodos[p.y][p.x];
		} else {
			console.log("Error, no existe el nodo en la tabla.");
			return null;
		}
	}
}

function crearCeldasHtml() {
	var styles: string = ' \
		.caja { \
		display: grid; \
		grid-template-columns: repeat(' + tab.tamX + ' , 1fr); } ';

	var styleSheet = document.createElement("style");
	styleSheet.innerText = styles;
	document.head.appendChild(styleSheet);

	let cont:HTMLElement|null = document.getElementById("contenedor");

	if(cont !== null) {
		var linea:string = '<button id="num" class="estilo" type="button" onclick="pressed(this)"></button>';

		var wrapper = document.createElement("div");

		for(let j=0;j<tab.tamY;j++) {
			for(let i=0;i<tab.tamX;i++) {
				wrapper.innerHTML = linea.replace("num", (j*tab.tamX + i + 1).toString());
				cont.appendChild(wrapper.firstChild as Node);
			}
		}
	} else {
		console.log("No se encontró nodo");
	}
}

function main() {
	crearCeldasHtml();
	new Agente({x:0,y:0});
	new Agente({x:1,y:0});
}
	
// var tab:Tablero = new Tablero({x:20,y:10});
var tab:Tablero = new Tablero({x:20,y:5});
var modo:Modos;

main();

// Funciones de interfaz
//
function pressed(objeto:HTMLElement) {
	let z = parseInt(objeto.id);
	z--;
	let xi = (z%tab.tamX);
	let yi = Math.floor(z/tab.tamX);

	let p1:Punto = {x: xi, y:yi};

	switch(modo) {
		case Modos.pared:
			tab.conmutar(Tipos.pared, p1);
			break;
		case Modos.muestra:
			tab.conmutar(Tipos.muestra, p1);
			break;
		case Modos.nave:
			tab.conmutar(Tipos.nave, p1);
			break;
		case Modos.migaja:
			tab.conmutar(Tipos.migaja,p1);
			break;
	}
	refresh();
}

function refresh() {
	for(let i=0;i<tab.tamX;i++) {
		for(let j=0;j<tab.tamY;j++) {
			let obj = document.getElementById((j*tab.tamX + i +1).toString());
			if(obj!== null)	{
				switch(tab.nodos[j][i].tipo) {
					case Tipos.pared:
						obj.className = "negro";
					break;
					case Tipos.vacio:
						obj.className = "blanco";
					break;
					case Tipos.nave:
						obj.className = "verde";
					break;
					case Tipos.muestra:
						obj.className = "azul";
					break;
					case Tipos.migaja:
						obj.className = "amarillo";
					break;
				}
			} else {
				console.log("No se encotró la celda correspondiente");
			}
		}
	}
	for(let i=0;i<todAgentes.length;i++) {
		let n:Punto = todAgentes[i].pos;
		let obj = document.getElementById((n.y*tab.tamX + n.x +1).toString());
		if(obj!==null) {
			obj.className = "rojo";
		} else {
			console.log("No se encotró la celda correspondiente");
		}

	}
}


function colocarPared() {
	detener();
	modo = Modos.pared;
}

function colocarMuestra() {
	detener();
	modo = Modos.muestra;
}
function colocarNaveUsuario() {
	detener();
	modo = Modos.nave;
}

function colocarMigaja() {
	detener();
	modo = Modos.migaja;
}

var proceso;

function siguientePaso() {
	for(let i=0;i<todAgentes.length;i++) {
		todAgentes[i].mover();
	}
	refresh();
}

function detener() {
	clearInterval(proceso);
	proceso = null;
	modo = Modos.detenido;
}

function controlCorrer() {
	if(modo===Modos.corriendo) {
		modo = Modos.detenido;
	} else {
		modo = Modos.corriendo;
	}
	if(modo === Modos.corriendo) {
		if(!proceso) {
			proceso = setInterval(siguientePaso,250);
			modo = Modos.corriendo;
		}
	} else {
		detener();
	}
}
