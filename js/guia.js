// ACORDEÓN INTERACTIVO DE LA GUÍA
document.querySelectorAll('.guia-pregunta').forEach(boton => {
  boton.addEventListener('click', () => {
    const elemento = boton.closest('.guia-acordeon');
    const seAbrira = !elemento.classList.contains('abierto');

    document.querySelectorAll('.guia-acordeon').forEach(item => {
      item.classList.remove('abierto');
      item.querySelector('.guia-pregunta').setAttribute('aria-expanded', 'false');
      item.querySelector('.guia-icono').textContent = '+';
    });

    if (seAbrira) {
      elemento.classList.add('abierto');
      boton.setAttribute('aria-expanded', 'true');
      boton.querySelector('.guia-icono').textContent = '−';
    }
  });
});
