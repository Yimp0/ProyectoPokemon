// ESTADO GLOBAL

const estado = {
  todosPokemon: [],
  todosObjetos: [],

  pokédexFiltrada:     [],
  pokédexPagina:       0,
  pokédexTiposActivos: new Set(),
  pokédexBusqueda:     '',

  selectorFiltrado:     [],
  selectorPagina:       0,
  selectorTiposActivos: new Set(),
  selectorBusqueda:     '',

  equipo:       [null, null, null, null, null, null],
  ranuraActiva: null,
};

const cache = {};


