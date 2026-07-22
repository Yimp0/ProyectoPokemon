// IMPORTAR / EXPORTAR

function generarExportacion() {
  const equipo = estado.equipo.filter(Boolean);
  if (!equipo.length) { document.getElementById('area-exportar').value = ''; return; }

  const texto = equipo.map(mon => {
    const cfg    = mon._config;
    const nombre = cfg.apodo ? `${cfg.apodo} (${mon.name})` : mon.name;
    const objeto = cfg.objeto ? ` @ ${cfg.objeto}` : '';
    const lineas = [
      `${nombre}${objeto}`,
      `Ability: ${cfg.habilidad || '—'}`,
      `Level: ${cfg.nivel || 100}`,
      `${cfg.naturaleza ? cfg.naturaleza.charAt(0).toUpperCase() + cfg.naturaleza.slice(1) : 'Hardy'} Nature`,
      `EVs: ${CLAVES_ESTADISTICAS.map(k => `${cfg.evs?.[k] || 0} ${NOMBRES_ESTADISTICAS[k]}`).filter(s => !s.startsWith('0')).join(' / ') || '—'}`,
      ...(cfg.movimientos || []).map(m => `- ${m}`),
    ];
    return lineas.join('\n');
  }).join('\n\n');

  document.getElementById('area-exportar').value = texto;
}

document.getElementById('boton-generar-exportar').addEventListener('click', generarExportacion);

document.getElementById('boton-copiar-exportar').addEventListener('click', () => {
  const area = document.getElementById('area-exportar');
  navigator.clipboard.writeText(area.value).then(() => {
    document.getElementById('boton-copiar-exportar').textContent = '✓ Copiado';
    setTimeout(() => { document.getElementById('boton-copiar-exportar').textContent = '📋 Copiar'; }, 1500);
  });
});

document.getElementById('boton-cargar-importar').addEventListener('click', async () => {
  const texto     = document.getElementById('area-importar').value.trim();
  const respuesta = document.getElementById('respuesta-importar');
  if (!texto) { respuesta.innerHTML = '<span class="importar-error">Pega un equipo primero.</span>'; return; }

  const bloques = texto.split(/\n\n+/).filter(Boolean);
  const nombres = bloques.map(bloque => {
    const primeraLinea = bloque.split('\n')[0];
    const coincidencia = primeraLinea.match(/\(([^)]+)\)/);
    if (coincidencia) return coincidencia[1].toLowerCase().trim();
    return primeraLinea.split('@')[0].trim().toLowerCase();
  }).slice(0, 6);

  respuesta.innerHTML = '<span class="cargando">Cargando Pokémon…</span>';
  const pokemonCargados = await Promise.all(nombres.map(n => obtenerPokemon(n).catch(() => null)));

  estado.equipo = [null, null, null, null, null, null];
  pokemonCargados.filter(Boolean).forEach((p, i) => {
    p._config = {
      apodo: '', habilidad: p.abilities[0]?.ability.name || '', objeto: '', naturaleza: 'hardy',
      movimientos: p.moves.slice(0, 4).map(m => m.move.name), nivel: 100, genero: 'M', esShiny: false,
      evs: { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 },
      ivs: { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 },
    };
    estado.equipo[i] = p;
  });

  mostrarResumenEquipo();
  mostrarCuadriculaSelector();
  guardarEquipo();
  respuesta.innerHTML = `<span class="importar-exito">✓ ${pokemonCargados.filter(Boolean).length} Pokémon importados.</span>`;
});


