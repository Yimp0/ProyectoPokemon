// EQUIPO — Resumen (fila de 6 slots)

function mostrarResumenEquipo() {
  const fila = document.getElementById('fila-slots');
  fila.innerHTML = '';

  for (let i = 0; i < MAX_EQUIPO; i++) {
    const mon       = estado.equipo[i];
    const ranura    = document.createElement('div');
    const estaSelec = estado.ranuraActiva === i;

    ranura.className      = `ranura-equipo ${mon ? 'ocupada' : ''} ${estaSelec ? 'seleccionada' : ''}`;
    ranura.dataset.indice = i;

    if (mon) {
      const cfg = mon._config;
      ranura.innerHTML = `
        <img src="${urlSprite(mon.name, 'gen5')}"
             alt="${mon.name}"
             onerror="this.src='${urlSprite(mon.name, 'dex')}'" />
        <span class="nombre-ranura">${cfg.apodo || mon.name}</span>
      `;
    } else {
      ranura.innerHTML = `<div class="numero-ranura">${i + 1}</div>`;
    }

    ranura.addEventListener('click', () => abrirEditorRanura(i));
    fila.appendChild(ranura);
  }

  const cantidad = estado.equipo.filter(Boolean).length;
  document.getElementById('contador-equipo-pie').textContent = `Equipo: ${cantidad} / 6`;
}


// EDITOR — Abrir/cerrar ranura

async function abrirEditorRanura(indice) {
  estado.ranuraActiva = indice;

  const mon        = estado.equipo[indice];
  const panelVacio = document.getElementById('editor-vacio');
  const formulario = document.getElementById('formulario-editor');

  if (!mon) {
    panelVacio.style.display = 'flex';
    formulario.style.display = 'none';
    return;
  }

  panelVacio.style.display = 'none';
  formulario.style.display = 'block';

  const cfg   = mon._config;
  const tipos = mon.types.map(t => t.type.name);

  const spriteEl   = document.getElementById('editor-sprite');
  spriteEl.src     = urlSprite(mon.name, 'gen5');
  spriteEl.onerror = function () { this.src = urlSprite(mon.name, 'dex'); };
  document.getElementById('editor-nombre-pokemon').textContent = mon.name;

  document.getElementById('editor-tipos').innerHTML =
    tipos.map(t => `<span class="insignia-tipo tipo-${t}">${t}</span>`).join('');

  document.getElementById('campo-apodo').value = cfg.apodo || '';

  await poblarSelectorFormas(mon);
  poblarSelectorHabilidades(mon, cfg.habilidad);
  poblarSelectorNaturaleza(cfg.naturaleza);
  mostrarEfectoNaturaleza(cfg.naturaleza);
  poblarSelectoresMovimientos(mon, cfg.movimientos);

  document.getElementById('campo-nivel').value   = cfg.nivel  || 100;
  document.getElementById('campo-genero').value  = cfg.genero || 'M';
  document.getElementById('campo-shiny').checked = !!cfg.esShiny;

  mostrarCamposEstadistica('ev', cfg.evs);
  mostrarCamposEstadistica('iv', cfg.ivs);
  actualizarTotalEVs();
  mostrarEstadisticasFinales(mon, cfg);

  document.getElementById('campo-objeto').value = cfg.objeto || '';
}

function cerrarEditorRanura() {
  estado.ranuraActiva = null;
  document.getElementById('editor-vacio').style.display    = 'flex';
  document.getElementById('formulario-editor').style.display = 'none';
  mostrarResumenEquipo();
}


// FORMULARIO — Poblar selectores

async function poblarSelectorFormas(mon) {
  const selector = document.getElementById('campo-forma');
  selector.innerHTML = '<option value="">— Normal —</option>';

  try {
    const urlEspecie = mon.species?.url || `${URL_POKEAPI}/pokemon-species/${mon.id}/`;
    const especie    = await obtenerJSON(urlEspecie);

    if (especie.varieties && especie.varieties.length > 1) {
      especie.varieties.forEach(v => {
        const opcion       = document.createElement('option');
        opcion.value       = v.pokemon.name;
        opcion.textContent = v.pokemon.name;
        if (v.pokemon.name === mon.name) opcion.selected = true;
        selector.appendChild(opcion);
      });
      document.getElementById('grupo-formas').style.display = '';
    } else {
      document.getElementById('grupo-formas').style.display = 'none';
    }
  } catch {
    document.getElementById('grupo-formas').style.display = 'none';
  }

  selector.addEventListener('change', async () => {
    if (!selector.value) return;
    const nuevoMon   = await obtenerPokemon(selector.value);
    nuevoMon._config = estado.equipo[estado.ranuraActiva]._config;
    estado.equipo[estado.ranuraActiva] = nuevoMon;
    abrirEditorRanura(estado.ranuraActiva);
  });
}

function poblarSelectorHabilidades(mon, habilidadActual) {
  const selector = document.getElementById('campo-habilidad');
  selector.innerHTML = '';
  mon.abilities.forEach(h => {
    const opcion       = document.createElement('option');
    opcion.value       = h.ability.name;
    opcion.textContent = h.is_hidden ? `${h.ability.name} (oculta)` : h.ability.name;
    if (h.ability.name === habilidadActual) opcion.selected = true;
    selector.appendChild(opcion);
  });
}

function poblarSelectorNaturaleza(naturalezaActual) {
  const selector = document.getElementById('campo-naturaleza');
  selector.innerHTML = '';
  Object.keys(NATURALEZAS).forEach(nombre => {
    const opcion       = document.createElement('option');
    opcion.value       = nombre;
    opcion.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    if (nombre === naturalezaActual) opcion.selected = true;
    selector.appendChild(opcion);
  });
  selector.addEventListener('change', () => mostrarEfectoNaturaleza(selector.value));
}

function mostrarEfectoNaturaleza(nombreNaturaleza) {
  const nat = NATURALEZAS[nombreNaturaleza];
  const el  = document.getElementById('efecto-naturaleza');
  if (!nat || (!nat.sube && !nat.baja)) {
    el.innerHTML = '<span>Naturaleza neutral</span>';
    return;
  }
  el.innerHTML = `
    <span class="naturaleza-sube">↑ ${NOMBRES_ESTADISTICAS[nat.sube]}</span>
    <span class="naturaleza-baja">↓ ${NOMBRES_ESTADISTICAS[nat.baja]}</span>
  `;
}

function poblarSelectoresMovimientos(mon, movimientosActuales = []) {
  const selectores = document.querySelectorAll('.campo-movimiento');
  const opciones   = mon.moves.map(m => {
    const opcion       = document.createElement('option');
    opcion.value       = m.move.name;
    opcion.textContent = m.move.name;
    return opcion;
  });

  selectores.forEach((sel, i) => {
    sel.innerHTML = `<option value="">— Movimiento ${i + 1} —</option>`;
    opciones.forEach(o => sel.appendChild(o.cloneNode(true)));
    if (movimientosActuales[i]) sel.value = movimientosActuales[i];
  });
}


// EVs e IVs

function mostrarCamposEstadistica(tipo, valoresActuales = {}) {
  const contenedor = document.getElementById(tipo === 'ev' ? 'barras-evs' : 'entradas-ivs');
  contenedor.innerHTML = '';

  const maximo   = tipo === 'ev' ? 252 : 31;
  const valorDef = tipo === 'ev' ? 0   : 31;

  CLAVES_ESTADISTICAS.forEach(clave => {
    const valor = valoresActuales[clave] ?? valorDef;
    const fila  = document.createElement('div');
    fila.className    = 'fila-estadistica';
    fila.dataset.stat = clave;

    if (tipo === 'ev') {
      fila.innerHTML = `
        <label class="etiqueta-estadistica">${NOMBRES_ESTADISTICAS[clave]}</label>
        <input type="range"  class="barra-ev"  min="0" max="${maximo}" value="${valor}" data-stat="${clave}" />
        <input type="number" class="numero-ev" min="0" max="${maximo}" value="${valor}" data-stat="${clave}" />
      `;
      const barra  = fila.querySelector('.barra-ev');
      const numero = fila.querySelector('.numero-ev');
      barra.addEventListener('input',  () => { numero.value = barra.value;  actualizarTotalEVs(); actualizarEstadisticasFinales(); });
      numero.addEventListener('input', () => { barra.value  = numero.value; actualizarTotalEVs(); actualizarEstadisticasFinales(); });
    } else {
      fila.innerHTML = `
        <label class="etiqueta-estadistica">${NOMBRES_ESTADISTICAS[clave]}</label>
        <input type="number" class="numero-iv" min="0" max="${maximo}" value="${valor}" data-stat="${clave}" />
      `;
      fila.querySelector('.numero-iv').addEventListener('input', actualizarEstadisticasFinales);
    }

    contenedor.appendChild(fila);
  });
}

function actualizarTotalEVs() {
  const total   = [...document.querySelectorAll('.numero-ev')]
    .reduce((suma, el) => suma + (parseInt(el.value) || 0), 0);
  const display = document.getElementById('total-evs');
  display.textContent = `(${total} / 510)`;
  display.style.color = total > 510 ? 'red' : '';
}

function leerEVs() {
  const evs = {};
  document.querySelectorAll('.numero-ev').forEach(el => { evs[el.dataset.stat] = parseInt(el.value) || 0; });
  return evs;
}

function leerIVs() {
  const ivs = {};
  document.querySelectorAll('.numero-iv').forEach(el => { ivs[el.dataset.stat] = parseInt(el.value) ?? 31; });
  return ivs;
}

function calcularEstadistica(clave, base, ev, iv, naturaleza, nivel) {
  const esHP   = clave === 'hp';
  const natMod = NATURALEZAS[naturaleza]?.sube === clave ? 1.1
               : NATURALEZAS[naturaleza]?.baja === clave ? 0.9
               : 1;
  if (esHP) {
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel / 100) + nivel + 10);
  }
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel / 100) + 5) * natMod);
}

function mostrarEstadisticasFinales(mon, cfg) {
  if (!mon) return;
  const contenedor = document.getElementById('estadisticas-finales');
  contenedor.innerHTML = '';

  const evs       = cfg?.evs        || {};
  const ivs       = cfg?.ivs        || {};
  const naturaleza = cfg?.naturaleza || 'hardy';
  const nivel     = cfg?.nivel      || 100;

  mon.stats.forEach(s => {
    const clave = claveEstadisticaDesdeAPI(s.stat.name);
    const base  = s.base_stat;
    const ev    = evs[clave] ?? 0;
    const iv    = ivs[clave] ?? 31;
    const final = calcularEstadistica(clave, base, ev, iv, naturaleza, nivel);
    const pct   = Math.min(100, (final / 714) * 100);

    const fila = document.createElement('div');
    fila.className = 'fila-estadistica-final';
    fila.innerHTML = `
      <span class="nombre-estadistica-final">${NOMBRES_ESTADISTICAS[clave]}</span>
      <div class="pista-barra-estadistica">
        <div class="relleno-barra-estadistica" style="width:${pct}%"></div>
      </div>
      <span class="valor-estadistica-final">${final}</span>
    `;
    contenedor.appendChild(fila);
  });
}

function actualizarEstadisticasFinales() {
  const i = estado.ranuraActiva;
  if (i === null || !estado.equipo[i]) return;
  mostrarEstadisticasFinales(estado.equipo[i], construirConfigDesdeFormulario());
}

function claveEstadisticaDesdeAPI(nombreAPI) {
  const mapa = {
    'hp':              'hp',
    'attack':          'atk',
    'defense':         'def',
    'special-attack':  'spa',
    'special-defense': 'spd',
    'speed':           'spe',
  };
  return mapa[nombreAPI] || nombreAPI;
}


// OBJETO — Autocompletado

let temporizadorObjeto;

document.getElementById('campo-objeto').addEventListener('input', () => {
  clearTimeout(temporizadorObjeto);
  const busqueda = document.getElementById('campo-objeto').value.trim().toLowerCase();
  if (busqueda.length < 2) { document.getElementById('autocompletado-objeto').style.display = 'none'; return; }
  temporizadorObjeto = setTimeout(() => mostrarAutocompletadoObjeto(busqueda), 250);
});

function mostrarAutocompletadoObjeto(busqueda) {
  const coincidencias = estado.todosObjetos.filter(obj => obj.name.includes(busqueda)).slice(0, 8);
  const lista         = document.getElementById('autocompletado-objeto');
  if (!coincidencias.length) { lista.style.display = 'none'; return; }

  lista.innerHTML = coincidencias.map(obj => `<li data-nombre="${obj.name}">${obj.name}</li>`).join('');
  lista.style.display = 'block';

  lista.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      document.getElementById('campo-objeto').value = li.dataset.nombre;
      lista.style.display = 'none';
    });
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('#contenedor-busqueda-objeto')) {
    document.getElementById('autocompletado-objeto').style.display = 'none';
  }
});


// GUARDAR CONFIGURACIÓN DEL FORMULARIO

function construirConfigDesdeFormulario() {
  const movimientos = [...document.querySelectorAll('.campo-movimiento')]
    .map(s => s.value)
    .filter(Boolean);

  return {
    apodo:       document.getElementById('campo-apodo').value.trim(),
    habilidad:   document.getElementById('campo-habilidad').value,
    objeto:      document.getElementById('campo-objeto').value.trim(),
    naturaleza:  document.getElementById('campo-naturaleza').value,
    movimientos,
    nivel:       parseInt(document.getElementById('campo-nivel').value) || 100,
    genero:      document.getElementById('campo-genero').value,
    esShiny:     document.getElementById('campo-shiny').checked,
    evs:         leerEVs(),
    ivs:         leerIVs(),
  };
}

document.getElementById('boton-guardar-editor').addEventListener('click', () => {
  const i = estado.ranuraActiva;
  if (i === null || !estado.equipo[i]) return;
  estado.equipo[i]._config = construirConfigDesdeFormulario();
  mostrarResumenEquipo();
  guardarEquipo();
  document.getElementById('boton-guardar-editor').textContent = '✓ Guardado';
  setTimeout(() => { document.getElementById('boton-guardar-editor').textContent = '✓ Guardar cambios'; }, 1500);
});

document.getElementById('boton-quitar-pokemon').addEventListener('click', () => {
  if (estado.ranuraActiva === null) return;
  estado.equipo[estado.ranuraActiva] = null;
  cerrarEditorRanura();
  guardarEquipo();
});

document.getElementById('boton-limpiar-equipo').addEventListener('click', () => {
  if (!estado.equipo.some(Boolean)) return;
  if (confirm('¿Limpiar todo el equipo?')) {
    estado.equipo = [null, null, null, null, null, null];
    cerrarEditorRanura();
    guardarEquipo();
  }
});


// SELECTOR — Cuadrícula de Pokémon

async function mostrarCuadriculaSelector() {
  const cuadricula = document.getElementById('cuadricula-selector');
  const inicio     = estado.selectorPagina * TAMANO_PAGINA;
  const porcion    = estado.selectorFiltrado.slice(inicio, inicio + TAMANO_PAGINA);

  cuadricula.innerHTML = '<div class="cargando">Cargando…</div>';
  if (!porcion.length) { cuadricula.innerHTML = '<div class="cargando">Sin resultados.</div>'; return; }

  const resultados = await Promise.allSettled(porcion.map(p => obtenerPokemon(p.name)));

  cuadricula.innerHTML = resultados.map(r => {
    if (r.status === 'rejected') return '';
    const p        = r.value;
    const enEquipo = estado.equipo.some(m => m && m.id === p.id);
    return `
      <div class="tarjeta-selector ${enEquipo ? 'en-equipo' : ''}" data-nombre="${p.name}">
        <img src="${urlSprite(p.name, 'gen5')}" alt="${p.name}"
             onerror="this.src='${urlSprite(p.name, 'dex')}'" loading="lazy" />
        <div class="nombre-tarjeta-selector">${p.name}</div>
        <button class="boton-agregar-selector" data-nombre="${p.name}">
          ${enEquipo ? '✓' : '+'}
        </button>
      </div>
    `;
  }).join('');

  cuadricula.querySelectorAll('.boton-agregar-selector').forEach(btn => {
    btn.addEventListener('click', () => agregarAlEquipo(btn.dataset.nombre));
  });
}

function mostrarPaginacionSelector() {
  mostrarPaginacion(
    'paginacion-selector',
    estado.selectorFiltrado.length,
    estado.selectorPagina,
    (p) => { estado.selectorPagina = p; mostrarCuadriculaSelector(); mostrarPaginacionSelector(); }
  );
}

const entradaBusquedaSelector = document.getElementById('entrada-busqueda-selector');
let   temporizadorSelector;

entradaBusquedaSelector.addEventListener('input', () => {
  clearTimeout(temporizadorSelector);
  temporizadorSelector = setTimeout(() => {
    estado.selectorBusqueda = entradaBusquedaSelector.value.trim().toLowerCase();
    mostrarAutocompletadoSelector(estado.selectorBusqueda);
    aplicarFiltrosSelector();
  }, 250);
});

document.getElementById('boton-busqueda-selector').addEventListener('click', () => {
  estado.selectorBusqueda = entradaBusquedaSelector.value.trim().toLowerCase();
  document.getElementById('autocompletado-selector').style.display = 'none';
  aplicarFiltrosSelector();
});

entradaBusquedaSelector.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    estado.selectorBusqueda = entradaBusquedaSelector.value.trim().toLowerCase();
    document.getElementById('autocompletado-selector').style.display = 'none';
    aplicarFiltrosSelector();
  }
});

function mostrarAutocompletadoSelector(busqueda) {
  const lista         = document.getElementById('autocompletado-selector');
  const coincidencias = estado.todosPokemon.filter(p => p.name.includes(busqueda)).slice(0, 6);
  if (busqueda.length < 2 || !coincidencias.length) { lista.style.display = 'none'; return; }

  lista.innerHTML = coincidencias.map(p => `
    <li data-nombre="${p.name}">
      <img src="${urlSprite(p.name, 'gen5')}" alt=""
           onerror="this.src='${urlSprite(p.name, 'dex')}'" />
      ${p.name}
    </li>
  `).join('');
  lista.style.display = 'block';

  lista.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      entradaBusquedaSelector.value = li.dataset.nombre;
      estado.selectorBusqueda       = li.dataset.nombre;
      lista.style.display           = 'none';
      aplicarFiltrosSelector();
    });
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('#contenedor-busqueda-selector')) {
    document.getElementById('autocompletado-selector').style.display = 'none';
  }
});

function mostrarFiltrosTipo(contexto) {
  const idContenedor = contexto === 'selector' ? 'filtros-tipo-selector' : 'filtros-tipo-pokedex';
  const contenedor   = document.getElementById(idContenedor);
  contenedor.innerHTML = '';

  TODOS_LOS_TIPOS.forEach(tipo => {
    const insignia       = document.createElement('span');
    insignia.className   = `insignia-tipo tipo-${tipo}`;
    insignia.textContent = tipo;
    insignia.addEventListener('click', () => {
      insignia.classList.toggle('activa');
      if (contexto === 'selector') {
        estado.selectorTiposActivos.has(tipo)
          ? estado.selectorTiposActivos.delete(tipo)
          : estado.selectorTiposActivos.add(tipo);
        aplicarFiltrosSelector();
      } else {
        estado.pokédexTiposActivos.has(tipo)
          ? estado.pokédexTiposActivos.delete(tipo)
          : estado.pokédexTiposActivos.add(tipo);
        aplicarFiltrosPokedex();
      }
    });
    contenedor.appendChild(insignia);
  });
}

async function aplicarFiltrosSelector() {
  let lista = [...estado.todosPokemon];

  if (estado.selectorBusqueda) {
    lista = lista.filter(p =>
      p.name.includes(estado.selectorBusqueda) ||
      String(idDesdeUrl(p.url)).includes(estado.selectorBusqueda)
    );
  }

  if (estado.selectorTiposActivos.size > 0) {
    const conjuntos = await Promise.all([...estado.selectorTiposActivos].map(obtenerNombresPorTipo));
    lista = lista.filter(p => conjuntos.every(c => c.has(p.name)));
  }

  estado.selectorFiltrado = lista;
  estado.selectorPagina   = 0;
  mostrarCuadriculaSelector();
  mostrarPaginacionSelector();
}


// AGREGAR AL EQUIPO

async function agregarAlEquipo(nombre) {
  const ranuraVacia = estado.equipo.findIndex(m => m === null);
  if (ranuraVacia === -1) { alert('¡Tu equipo ya está completo! (6/6)'); return; }

  const p = await obtenerPokemon(nombre);
  if (estado.equipo.some(m => m && m.id === p.id)) { alert(`${nombre} ya está en el equipo.`); return; }

  p._config = {
    apodo:       '',
    habilidad:   p.abilities[0]?.ability.name || '',
    objeto:      '',
    naturaleza:  'hardy',
    movimientos: p.moves.slice(0, 4).map(m => m.move.name),
    nivel:       100,
    genero:      'M',
    esShiny:     false,
    evs:  { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs:  { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  };

  estado.equipo[ranuraVacia] = p;
  mostrarResumenEquipo();
  guardarEquipo();
  await abrirEditorRanura(ranuraVacia);
  mostrarCuadriculaSelector();
}


