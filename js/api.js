// UTILIDADES DE SPRITES

function nombreShowdown(nombre) {
  return nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function urlSprite(nombre, tipo = 'gen5') {
  const base = tipo === 'dex' ? URL_SPRITE_DEX : URL_SPRITE_GEN5;
  return `${base}${nombreShowdown(nombre)}.png`;
}

function idDesdeUrl(url) {
  const partes = url.split('/').filter(Boolean);
  return parseInt(partes[partes.length - 1], 10);
}


// PETICIONES A LA API

async function obtenerJSON(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  return respuesta.json();
}

async function obtenerPokemon(nombreOId) {
  const clave = String(nombreOId).toLowerCase();
  if (cache[clave]) return cache[clave];
  const datos  = await obtenerJSON(`${URL_POKEAPI}/pokemon/${clave}`);
  cache[clave] = datos;
  return datos;
}

async function obtenerNombresPorTipo(nombreTipo) {
  const datos = await obtenerJSON(`${URL_POKEAPI}/type/${nombreTipo}`);
  return new Set(datos.pokemon.map(p => p.pokemon.name));
}


// CARGA INICIAL

async function cargarDatosIniciales() {
  const datosPokemon         = await obtenerJSON(`${URL_POKEAPI}/pokemon?limit=1010&offset=0`);
  estado.todosPokemon        = datosPokemon.results;
  estado.pokédexFiltrada     = [...estado.todosPokemon];
  estado.selectorFiltrado    = [...estado.todosPokemon];

  const datosObjetos  = await obtenerJSON(`${URL_POKEAPI}/item?limit=2000&offset=0`);
  estado.todosObjetos = datosObjetos.results;

  mostrarCuadriculaSelector();
  mostrarPaginacionSelector();
  mostrarCuadriculaPokedex();
  mostrarPaginacionPokedex();
}


