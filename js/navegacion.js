// NAVEGACIÓN

function irAPagina(idPagina) {
  document.querySelectorAll('.pagina').forEach(p => p.classList.remove('pagina-activa'));
  const destino = document.getElementById(`pagina-${idPagina}`);
  if (destino) destino.classList.add('pagina-activa');

  document.querySelectorAll('.boton-nav').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.pagina === idPagina);
  });

  document.getElementById('navegacion-movil').classList.remove('abierto');
  const botonMenu = document.getElementById('boton-menu');
  botonMenu.setAttribute('aria-expanded', 'false');
  botonMenu.setAttribute('aria-label', 'Abrir menú');
 // ← AÑADIR ESTO: forzar que el selector no flote
  const selector = document.getElementById('selector-pokemon');
  if (selector) {
    selector.style.position = idPagina === 'armador' ? '' : 'static';
  }
  if (idPagina === 'importar-exportar') generarExportacion();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.boton-nav');
  if (btn && btn.dataset.pagina) irAPagina(btn.dataset.pagina);
});

document.getElementById('boton-menu').addEventListener('click', () => {
  const menu = document.getElementById('navegacion-movil');
  const abierto = menu.classList.toggle('abierto');
  document.getElementById('boton-menu').setAttribute('aria-expanded', String(abierto));
  document.getElementById('boton-menu').setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});

