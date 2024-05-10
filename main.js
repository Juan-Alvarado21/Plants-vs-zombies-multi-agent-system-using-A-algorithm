var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Tipos;
(function (Tipos) {
    Tipos[Tipos["vacio"] = 0] = "vacio";
    Tipos[Tipos["pared"] = 1] = "pared";
    Tipos[Tipos["nave"] = 2] = "nave";
    Tipos[Tipos["muestra"] = 3] = "muestra";
    Tipos[Tipos["agente"] = 4] = "agente";
    Tipos[Tipos["migaja"] = 5] = "migaja";
    Tipos[Tipos["agente"] = 5] = "agente";
})(Tipos || (Tipos = {}));
var Modos;
(function (Modos) {
    Modos[Modos["corriendo"] = 0] = "corriendo";
    Modos[Modos["pared"] = 1] = "pared";
    Modos[Modos["muestra"] = 2] = "muestra";
    Modos[Modos["nave"] = 3] = "nave";
    Modos[Modos["detenido"] = 4] = "detenido";
    Modos[Modos["migaja"] = 5] = "migaja";
    Modos[Modos["agente"] = 5] = "agente";
})(Modos || (Modos = {}));
function randint(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function distMan(p1, p2) {
    var pi1 = puntoAInt(p1);
    var pi2 = puntoAInt(p2);
    return Math.abs(pi1.x - pi2.x) + Math.abs(pi1.y - pi2.y);
}
function puntoAInt(p) {
    return { x: Math.floor(p.x), y: Math.floor(p.y) };
}
var todAgentes = [];
var usarEstrella = true;
var usarMigajas = true;
function distManhattan(p) {
    return Math.abs(tab.navePos.x - p.x) + Math.abs(tab.navePos.y - p.y);
}
var Agente = /** @class */ (function () {
    function Agente(pos) {
        this.movsPendientes = [];
        this.pos = pos;
        this.cargando = false;
        todAgentes.push(this);
    }
    Agente.prototype.moverA = function (pos) {
        this.pos = pos;
    };
    Agente.prototype.mover = function () {
        // Si existe una muestra en el nodo actual, lo agarra.
        var nodoActual = tab.getNodo(this.pos);
        if (nodoActual !== null) {
            if (nodoActual.tipo === Tipos.muestra && !this.cargando) {
                this.cargando = true;
                nodoActual.tipo = Tipos.vacio;
            }
        }
        if (!this.cargando) {
            var puntos = tab.getMovs(this.pos);
            var tienenMigaja = [];
            for (var i = 0; i < puntos.length; i++) {
                var n = tab.getNodo(puntos[i]);
                if (n !== null) {
                    if (n.tipo === Tipos.migaja) {
                        tienenMigaja.push(n);
                    }
                }
                else {
                    console.log("Error al obtener los movs alrededor.");
                }
            }
            if (tienenMigaja.length !== 0) {
                // Va a ir al migaja más lejano a la nave.
                var max = tienenMigaja[0];
                for (var i = 1; i < tienenMigaja.length; i++) {
                    if (distManhattan(tienenMigaja[i].pos) > distManhattan(max.pos)) {
                        max = tienenMigaja[i];
                    }
                }
                max.quitarMigaja();
                this.moverA(max.pos);
            }
            else {
                // Movimiento aleatorio
                this.moverA(puntos[randint(0, puntos.length - 1)]);
            }
        }
        else {
            if ((nodoActual === null || nodoActual === void 0 ? void 0 : nodoActual.tipo) === Tipos.nave) {
                this.cargando = false;
            }
            else {
                // Regresar con a-estrella o manhattan
                if (!usarEstrella) {
                    // manhattan
                    var movs = tab.getMovs(this.pos);
                    var min = movs[0];
                    for (var i = 1; i < movs.length; i++) {
                        if (distManhattan(min) > distManhattan(movs[i])) {
                            min = movs[i];
                        }
                    }
                    nodoActual === null || nodoActual === void 0 ? void 0 : nodoActual.agregarMigaja();
                    this.moverA(min);
                }
                else {
                    // Nodo origen: El mismo nodo
                    // Nodo objetivo: El nodo de nave
                    var origen = tab.getNodo(this.pos);
                    var destino = tab.getNodo(tab.navePos);
                    if (this.movsPendientes.length !== 0) {
                        this.moverA(this.movsPendientes[this.movsPendientes.length - 1]);
                        this.movsPendientes.pop();
                        // Se mueve al último elemento el listado, y lo quita.
                    }
                    else {
                        var sinExplorar = [];
                        var precedente = new Map();
                        var costos = new Map();
                        var existe = new Map(); // Si existe en sinExplorar
                        costos.set(origen, 0);
                        var f = new Map(); // De la formula f(n) = c(n) + h(n)
                        f.set(origen, costos.get(origen) + distManhattan(origen.pos));
                        sinExplorar.push(origen);
                        existe.set(origen, true);
                        while (sinExplorar.length !== 0) {
                            // Obtiene el mínimo valor de f
                            var n = sinExplorar[0];
                            var min = f.get(n); // Revisar si es cierto
                            var posN = 0;
                            for (var i = 1; i < sinExplorar.length; i++) {
                                if (f.get(sinExplorar[i]) < min) {
                                    n = sinExplorar[i];
                                    min = f.get(sinExplorar[i]);
                                    posN = i;
                                }
                            }
                            if (n === destino) {
                                var iterator = destino;
                                while (iterator !== origen) {
                                    this.movsPendientes.push(iterator.pos);
                                    iterator = precedente.get(iterator);
                                }
                                break;
                            }
                            // quitar nodo
                            sinExplorar.splice(posN, 1);
                            existe.set(n, false);
                            var vecinos = [];
                            var lugares = tab.getMovs(n.pos);
                            for (var i = 0; i < lugares.length; i++) {
                                vecinos.push(tab.getNodo(lugares[i]));
                                var cTemp = costos.get(n) + 1;
                                var menorQue = false;
                                if (costos.get(vecinos[i]) === undefined) {
                                    menorQue = true;
                                }
                                else if (costos.get(vecinos[i]) > cTemp) {
                                    menorQue = true;
                                }
                                if (menorQue) {
                                    precedente.set(vecinos[i], n);
                                    costos.set(vecinos[i], cTemp);
                                    f.set(vecinos[i], cTemp + distManhattan(vecinos[i].pos));
                                    if (existe.get(vecinos[i]) === undefined) {
                                        sinExplorar.push(vecinos[i]);
                                    }
                                    else if (existe.get(vecinos[i]) === false) {
                                        sinExplorar.push(vecinos[i]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    return Agente;
}());
var Nodo = /** @class */ (function () {
    function Nodo(tipo, pos) {
        this.migajas = 0;
        this.pos = puntoAInt(pos);
        this.tipo = tipo;
        this.migajas = 0;
        this.vacio = this.tipo === Tipos.vacio;
    }
    Nodo.prototype.tieneMigajas = function () {
        return this.migajas > 0;
    };
    Nodo.prototype.quitarMigaja = function () {
        if (this.tipo === Tipos.migaja && this.migajas > 0) {
            this.migajas--;
            if (this.migajas === 0) {
                this.tipo = Tipos.vacio;
            }
            return true;
        }
        else {
            return false;
        }
    };
    Nodo.prototype.agregarMigaja = function () {
        if (this.tipo === Tipos.migaja) {
            this.migajas++;
            return true;
        }
        else if (this.tipo === Tipos.vacio) {
            this.tipo = Tipos.migaja;
            this.migajas = 1;
            return true;
        }
        else {
            return false;
        }
    };
    return Nodo;
}());
var Tablero = /** @class */ (function () {
    function Tablero(dim) {
        this.dim = puntoAInt(dim);
        this.tamX = this.dim.x;
        this.tamY = this.dim.y;
        this.nodos = [];
        // Inicializa el matriz de nodos en 0
        for (var i = 0; i < this.tamY; i++) {
            var fila = [];
            for (var j = 0; j < this.tamX; j++) {
                fila.push(new Nodo(Tipos.vacio, { y: i, x: j }));
            }
            this.nodos.push(__spreadArray([], fila, true));
        }
        this.navePos = { x: 1, y: 1 }; // No tener un tablero menor a 2x2
        this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.nave;
    }
    Tablero.prototype.conmutar = function (t, p) {
        var n = this.nodos[p.y][p.x];
        if (t !== Tipos.nave) {
            if (n.tipo === t && n.tipo !== Tipos.vacio) {
                n.tipo = Tipos.vacio;
            }
            else if (n.tipo == Tipos.vacio) {
                n.tipo = t;
                if (Tipos.migaja === t) {
                    n.agregarMigaja();
                }
            }
        }
        else {
            if (n.tipo === Tipos.vacio) {
                this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.vacio;
                this.navePos = p;
                this.nodos[this.navePos.y][this.navePos.x].tipo = Tipos.nave;
            }
        }
    };
    Tablero.prototype.enTabla = function (p) {
        var pInt = puntoAInt(p);
        if (pInt.x >= 0 && pInt.x < this.tamX) {
            if (pInt.y >= 0 && pInt.y < this.tamY) {
                return true;
            }
        }
        return false;
    };
    Tablero.prototype.getMovs = function (p) {
        var _a;
        var posPuntos;
        var ret = [];
        var pInt = puntoAInt(p);
        if (this.enTabla(pInt)) {
            posPuntos = [
                { x: pInt.x - 1, y: pInt.y },
                { x: pInt.x + 1, y: pInt.y },
                { x: pInt.x, y: pInt.y - 1 },
                { x: pInt.x, y: pInt.y + 1 }
            ];
            for (var i = 0; i < posPuntos.length; i++) {
                if (this.enTabla(posPuntos[i]) && ((_a = tab.getNodo(posPuntos[i])) === null || _a === void 0 ? void 0 : _a.tipo) !== Tipos.pared) {
                    ret.push(posPuntos[i]);
                }
            }
        }
        return ret;
    };
    Tablero.prototype.getNodo = function (p) {
        if (this.enTabla(p)) {
            return this.nodos[p.y][p.x];
        }
        else {
            console.log("Error, no existe el nodo en la tabla.");
            return null;
        }
    };
    return Tablero;
}());
function crearCeldasHtml() {
    var styles = ' \
		.caja { \
		display: grid; \
		grid-template-columns: repeat(' + tab.tamX + ' , 1fr); } ';
    var styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    var cont = document.getElementById("contenedor");
    if (cont !== null) {
        var linea = '<button id="num" class="estilo" type="button" onclick="pressed(this)"></button>';
        var wrapper = document.createElement("div");
        for (var j = 0; j < tab.tamY; j++) {
            for (var i = 0; i < tab.tamX; i++) {
                wrapper.innerHTML = linea.replace("num", (j * tab.tamX + i + 1).toString());
                cont.appendChild(wrapper.firstChild);
            }
        }
    }
    else {
        console.log("No se encontró nodo");
    }
}
function main() {
    crearCeldasHtml();
}
var tab = new Tablero({ x: 12, y: 5 });
var modo;
main();
// Funciones de interfaz
//
function pressed(objeto) {
    var z = parseInt(objeto.id);
    z--;
    var xi = (z % tab.tamX);
    var yi = Math.floor(z / tab.tamX);
    var p1 = { x: xi, y: yi };
    switch (modo) {

        case Modos.agente:
            new Agente(p1);
            break;
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
            tab.conmutar(Tipos.migaja, p1);
            break;
    }
    refresh();
}
function refresh() {
    for (var i = 0; i < tab.tamX; i++) {
        for (var j = 0; j < tab.tamY; j++) {
            var obj = document.getElementById((j * tab.tamX + i + 1).toString());
            if (obj !== null) {
                switch (tab.nodos[j][i].tipo) {

                    case Tipos.agente:
                        obj.className = "rojo";
                        break;
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
            }
            else {
                console.log("No se encotró la celda correspondiente");
            }
        }
    }
    for (var i = 0; i < todAgentes.length; i++) {
        var n = todAgentes[i].pos;
        var obj = document.getElementById((n.y * tab.tamX + n.x + 1).toString());
        if (obj !== null) {
            obj.className = "rojo";
        }
        else {
            console.log("No se encotró la celda correspondiente");
        }
    }
}

function colocarAgente() {
    detener();
    modo = Modos.agente;
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
    for (var i = 0; i < todAgentes.length; i++) {
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
    if (modo === Modos.corriendo) {
        modo = Modos.detenido;
    }
    else {
        modo = Modos.corriendo;
    }
    if (modo === Modos.corriendo) {
        if (!proceso) {
            proceso = setInterval(siguientePaso, 250);
            modo = Modos.corriendo;
        }
    }
    else {
        detener();
    }
}
