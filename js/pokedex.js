// POKÉDEX — Cuadrícula independiente

async function mostrarCuadriculaPokedex() {
  const cuadricula = document.getElementById('cuadricula-pokedex');
  const titulo     = document.getElementById('titulo-resultados-pokedex');
  const inicio     = estado.pokédexPagina * TAMANO_PAGINA;
  const porcion    = estado.pokédexFiltrada.slice(inicio, inicio + TAMANO_PAGINA);

  titulo.textContent   = `${estado.pokédexFiltrada.length} Pokémon`;
  cuadricula.innerHTML = '<div class="cargando">Cargando…</div>';
  if (!porcion.length) { cuadricula.innerHTML = '<div class="cargando">Sin resultados.</div>'; return; }

  const resultados = await Promise.allSettled(porcion.map(p => obtenerPokemon(p.name)));

  cuadricula.innerHTML = resultados.map(r => {
    if (r.status === 'rejected') return '';
    const p     = r.value;
    const tipos = p.types.map(t => t.type.name);
    return `
      <div class="tarjeta-pokedex" data-nombre="${p.name}">
        <img src="${urlSprite(p.name, 'gen5')}" alt="${p.name}"
             onerror="this.src='${urlSprite(p.name, 'dex')}'" loading="lazy" />
        <div class="numero-pokedex">#${String(p.id).padStart(4, '0')}</div>
        <div class="nombre-pokedex">${p.name}</div>
        <div class="tipos-pokedex">
          ${tipos.map(t => `<span class="insignia-tipo tipo-${t}">${t}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  cuadricula.querySelectorAll('.tarjeta-pokedex').forEach(tarjeta => {
    tarjeta.addEventListener('click', () => abrirModalPokedex(tarjeta.dataset.nombre));
  });
}

function mostrarPaginacionPokedex() {
  mostrarPaginacion(
    'paginacion-pokedex',
    estado.pokédexFiltrada.length,
    estado.pokédexPagina,
    (p) => {
      estado.pokédexPagina = p;
      mostrarCuadriculaPokedex();
      mostrarPaginacionPokedex();
      document.getElementById('pagina-pokedex').scrollTop = 0;
    }
  );
}

const entradaBusquedaPokedex = document.getElementById('entrada-busqueda-pokedex');
let   temporizadorPokedex;

entradaBusquedaPokedex.addEventListener('input', () => {
  clearTimeout(temporizadorPokedex);
  temporizadorPokedex = setTimeout(() => {
    estado.pokédexBusqueda = entradaBusquedaPokedex.value.trim().toLowerCase();
    aplicarFiltrosPokedex();
  }, 300);
});

document.getElementById('boton-buscar-pokedex').addEventListener('click', () => {
  estado.pokédexBusqueda = entradaBusquedaPokedex.value.trim().toLowerCase();
  aplicarFiltrosPokedex();
});

document.getElementById('boton-limpiar-pokedex').addEventListener('click', () => {
  entradaBusquedaPokedex.value  = '';
  estado.pokédexBusqueda        = '';
  estado.pokédexTiposActivos.clear();
  document.querySelectorAll('#filtros-tipo-pokedex .insignia-tipo').forEach(b => b.classList.remove('activa'));
  aplicarFiltrosPokedex();
});

async function aplicarFiltrosPokedex() {
  let lista = [...estado.todosPokemon];

  if (estado.pokédexBusqueda) {
    lista = lista.filter(p =>
      p.name.includes(estado.pokédexBusqueda) ||
      String(idDesdeUrl(p.url)).includes(estado.pokédexBusqueda)
    );
  }

  if (estado.pokédexTiposActivos.size > 0) {
    const conjuntos = await Promise.all([...estado.pokédexTiposActivos].map(obtenerNombresPorTipo));
    lista = lista.filter(p => conjuntos.every(c => c.has(p.name)));
  }

  estado.pokédexFiltrada = lista;
  estado.pokédexPagina   = 0;
  mostrarCuadriculaPokedex();
  mostrarPaginacionPokedex();
}

async function abrirModalPokedex(nombre) {
  const fondo     = document.getElementById('fondo-modal-pokedex');
  const contenido = document.getElementById('contenido-modal-pokedex');
  fondo.classList.add('abierto');
  contenido.innerHTML = '<div class="cargando">Cargando…</div>';

  try {
    const p     = await obtenerPokemon(nombre);
    const tipos = p.types.map(t => t.type.name);
    const movs  = p.moves.slice(0, 20).map(m => m.move.name);

    const htmlEstadisticas = p.stats.map(s => `
      <div class="barra-estadistica-base">
        <div class="etiqueta-barra-estadistica">
          <span>${s.stat.name.toUpperCase().replace('-', ' ')}</span>
          <span>${s.base_stat}</span>
        </div>
        <div class="pista-barra-estadistica-base">
          <div class="relleno-barra-estadistica-base" style="width:${(s.base_stat / 255) * 100}%"></div>
        </div>
      </div>
    `).join('');

    contenido.innerHTML = `
      <img class="sprite-modal-pokedex" src="${urlSprite(p.name, 'dex')}" alt="${p.name}"
           onerror="this.src='${urlSprite(p.name, 'gen5')}'" />
      <h3>${p.name}</h3>
      <div class="id-modal-pokedex">#${String(p.id).padStart(4, '0')} · ${p.height / 10}m · ${p.weight / 10}kg</div>
      <div class="tipos-modal-pokedex">
        ${tipos.map(t => `<span class="insignia-tipo tipo-${t}">${t}</span>`).join('')}
      </div>
      <h4>Estadísticas Base</h4>
      ${htmlEstadisticas}
      <h4>Movimientos (primeros 20)</h4>
      <div class="lista-movimientos-modal">
        ${movs.map(m => `<span class="etiqueta-movimiento-modal">${m}</span>`).join('')}
      </div>
      <button id="boton-agregar-al-equipo" data-nombre="${p.name}">+ Añadir al equipo</button>
    `;

    contenido.querySelector('#boton-agregar-al-equipo').addEventListener('click', async () => {
      await agregarAlEquipo(p.name);
      cerrarModalPokedex();
      irAPagina('armador');
    });
  } catch (err) {
    contenido.innerHTML = `<div class="cargando">Error: ${err.message}</div>`;
  }
}

document.getElementById('cerrar-modal-pokedex').addEventListener('click', cerrarModalPokedex);
document.getElementById('fondo-modal-pokedex').addEventListener('click', e => {
  if (e.target === e.currentTarget) cerrarModalPokedex();
});

function cerrarModalPokedex() {
  document.getElementById('fondo-modal-pokedex').classList.remove('abierto');
}


// PAGINACIÓN — Función reutilizable

function mostrarPaginacion(idContenedor, total, paginaActual, alCambiarPagina) {
  const contenedor   = document.getElementById(idContenedor);
  const totalPaginas = Math.ceil(total / TAMANO_PAGINA);
  const p            = paginaActual;

  let html = `<button class="boton-paginacion" id="${idContenedor}-anterior" ${p === 0 ? 'disabled' : ''}>◀</button>`;

  const inicio = Math.max(0, p - 2);
  const fin    = Math.min(totalPaginas - 1, p + 2);

  if (inicio > 0)      html += `<button class="boton-paginacion" data-p="0">1</button>${inicio > 1 ? '<span>…</span>' : ''}`;
  for (let i = inicio; i <= fin; i++) {
    html += `<button class="boton-paginacion ${i === p ? 'activo' : ''}" data-p="${i}">${i + 1}</button>`;
  }
  if (fin < totalPaginas - 1) html += `${fin < totalPaginas - 2 ? '<span>…</span>' : ''}<button class="boton-paginacion" data-p="${totalPaginas - 1}">${totalPaginas}</button>`;

  html += `<button class="boton-paginacion" id="${idContenedor}-siguiente" ${p >= totalPaginas - 1 ? 'disabled' : ''}>▶</button>`;

  contenedor.innerHTML = html;
  contenedor.querySelector(`#${idContenedor}-anterior`)?.addEventListener('click', () => alCambiarPagina(p - 1));
  contenedor.querySelector(`#${idContenedor}-siguiente`)?.addEventListener('click', () => alCambiarPagina(p + 1));
  contenedor.querySelectorAll('.boton-paginacion[data-p]').forEach(btn => {
    btn.addEventListener('click', () => alCambiarPagina(Number(btn.dataset.p)));
  });
}


