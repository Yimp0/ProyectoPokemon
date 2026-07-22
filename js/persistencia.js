// PERSISTENCIA en localStorage

function guardarEquipo() {
  const datos = estado.equipo.map(m => m ? { nombre: m.name, config: m._config } : null);
  localStorage.setItem('armador_equipo_v1', JSON.stringify(datos));
}

async function cargarEquipoGuardado() {
  const raw = localStorage.getItem('armador_equipo_v1');
  if (!raw) return;
  try {
    const datos           = JSON.parse(raw);
    const pokemonCargados = await Promise.all(datos.map(d => d ? obtenerPokemon(d.nombre).catch(() => null) : null));
    pokemonCargados.forEach((p, i) => {
      if (!p) return;
      p._config        = datos[i].config;
      estado.equipo[i] = p;
    });
    mostrarResumenEquipo();
    mostrarCuadriculaSelector();
  } catch { /* datos corruptos, ignorar */ }
}


// INICIALIZACIÓN

(async function inicializar() {
  mostrarFiltrosTipo('selector');
  mostrarFiltrosTipo('pokedex');
  mostrarResumenEquipo();
  await cargarDatosIniciales();
  await cargarEquipoGuardado();
})();
