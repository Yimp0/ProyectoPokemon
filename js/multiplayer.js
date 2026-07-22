/*
  ═══════════════════════════════════════════════════════════════
  multiplayer.js  —  Sistema de Batalla Multijugador
  Pokémon Teambuilder
  ═══════════════════════════════════════════════════════════════

  ARQUITECTURA:
  ┌─────────────┐   WebSocket   ┌────────────────────┐
  │  Cliente A  │ ◄───────────► │  Servidor Node.js  │
  │ (este arch) │               │  (ver SERVER.md)   │
  └─────────────┘               └────────────────────┘
        ▲  WebSocket
        │
  ┌─────────────┐
  │  Cliente B  │
  │ (otro tab   │
  │  o PC)      │
  └─────────────┘

  DEPENDENCIAS de script.js que se reutilizan:
  • estado.equipo            → equipo del jugador
  • NATURALEZAS              → cálculo de stats
  • NOMBRES_ESTADISTICAS     → etiquetas
  • CLAVES_ESTADISTICAS      → orden de stats

  DEPENDENCIAS de battle.js que se reutilizan:
  • EFECTIVIDAD_TIPOS        → multiplicadores de tipo
  • TIPOS_MOVIMIENTO         → tipo de cada movimiento
  • PODER_MOVIMIENTO         → potencia de cada movimiento
  • CATEGORIA_MOVIMIENTO     → físico / especial / estado
  • calcularStatBatalla()    → fórmula de stats
  • calcularStatsCompletos() → stats de un Pokémon completo
  • claveStatBatalla()       → normaliza nombres de stat
  • statConMod()             → aplica modificadores de etapa
  • urlSpriteBatalla()       → URL del sprite frontal
  • urlSpriteBatallaEspalda()→ URL del sprite de espalda
  ═══════════════════════════════════════════════════════════════
*/


// ─── CONFIGURACIÓN DEL SERVIDOR ────────────────────────────────
//
//  ▸ Cambia esta URL cuando tengas un servidor real.
//    Ejemplo producción: 'wss://tu-servidor.com/batalla'
//    Ejemplo desarrollo: 'ws://localhost:3000'
//
const MULTI_WS_URL = 'ws://localhost:3000';


const MSG = {
  // Cliente → Servidor
  CREAR_SALA:    'CREAR_SALA',    // Jugador A crea sala
  UNIRSE_SALA:   'UNIRSE_SALA',   // Jugador B se une con código
  MOVIMIENTO:    'MOVIMIENTO',    // Jugador envía su movimiento del turno
  RENDIRSE:      'RENDIRSE',      // Jugador abandona la batalla
  REVANCHA:      'REVANCHA',      // Jugador solicita revancha
  PING:          'PING',          // Keepalive

  // Servidor → Cliente
  SALA_CREADA:   'SALA_CREADA',   // Confirma sala + devuelve código
  RIVAL_LISTO:   'RIVAL_LISTO',   // El rival se conectó
  BATALLA_INICIO:'BATALLA_INICIO',// Ambos listos, empieza la batalla
  TURNO_RESULTADO:'TURNO_RESULTADO',// Resultado del turno procesado
  RIVAL_MOVIO:   'RIVAL_MOVIO',   // El rival ya eligió (sin revelar qué)
  BATALLA_FIN:   'BATALLA_FIN',   // Batalla terminada (victoria/derrota)
  RIVAL_DESCONECTADO:'RIVAL_DESCONECTADO',
  REVANCHA_SOLICITADA:'REVANCHA_SOLICITADA',
  ERROR:         'ERROR',
};


// ─── ESTADO MULTIJUGADOR ───────────────────────────────────────

const multi = {
  // Conexión
  ws:             null,
  conectado:      false,
  reintentando:   false,
  pingInterval:   null,

  // Sala y jugadores
  codigoSala:     null,
  esCreador:      false,       // true = Jugador A, false = Jugador B
  nombreLocal:    '',
  nombreRival:    '',

  // Pokémon seleccionado
  indiceSeleccionado: 0,

  // Estado de batalla multijugador (espejo de battle.js pero separado)
  batalla: {
    activa:       false,
    miTurno:      false,
    movimientoElegido: null,

    local: {
      pokemon:    null,
      hpActual:   0,
      hpMax:      0,
      nombre:     '',
      nivel:      100,
      stats:      {},
      tipos:      [],
      movimientos: [],
      estado:     null,
      modificadores: { atk:0, def:0, spa:0, spd:0, spe:0 },
    },

    rival: {
      pokemon:    null,   // Solo el nombre y sprite, stats son del servidor
      hpActual:   0,
      hpMax:      0,
      nombre:     '',
      nivel:      100,
      tipos:      [],
      movimientos: [],
      estado:     null,
    },
  },
};


// ─── REFERENCIAS DOM ──────────────────────────────────────────

const mdom = {};

function cachearDOMMulti() {
  mdom.lobby          = document.getElementById('multi-lobby');
  mdom.salaEspera     = document.getElementById('multi-sala-espera');
  mdom.arena          = document.getElementById('multi-arena');
  mdom.resultado      = document.getElementById('multi-resultado');

  mdom.estadoConexion = document.getElementById('multi-estado-conexion');
  mdom.textoConexion  = document.getElementById('multi-conexion-texto');
  mdom.inputNombre    = document.getElementById('multi-nombre-entrenador');
  mdom.slotsEquipo    = document.getElementById('multi-slots-equipo');

  mdom.btnCrear       = document.getElementById('multi-btn-crear');
  mdom.btnUnirse      = document.getElementById('multi-btn-unirse');
  mdom.inputCodigo    = document.getElementById('multi-input-codigo');

  mdom.codigoSala     = document.getElementById('multi-codigo-sala');
  mdom.btnCopiarCodigo= document.getElementById('multi-btn-copiar-codigo');
  mdom.esperaTexto    = document.getElementById('multi-espera-texto');
  mdom.localNombre    = document.getElementById('multi-local-nombre');
  mdom.rivalNombreSala= document.getElementById('multi-rival-nombre');
  mdom.btnCancelarSala= document.getElementById('multi-btn-cancelar-sala');

  // Arena
  mdom.spriteRival    = document.getElementById('multi-sprite-rival');
  mdom.spriteLocal    = document.getElementById('multi-sprite-local');
  mdom.nombreRival    = document.getElementById('multi-nombre-rival');
  mdom.nivelRival     = document.getElementById('multi-nivel-rival');
  mdom.nombreLocal    = document.getElementById('multi-nombre-local');
  mdom.nivelLocal     = document.getElementById('multi-nivel-local');
  mdom.hpRivalBarra   = document.getElementById('multi-hp-rival');
  mdom.hpLocalBarra   = document.getElementById('multi-hp-local');
  mdom.hpLocalNums    = document.getElementById('multi-hp-numeros-local');
  mdom.textoBatalla   = document.getElementById('multi-texto-batalla');
  mdom.logBatalla     = document.getElementById('multi-log');
  mdom.accionesBatalla= document.getElementById('multi-acciones');
  mdom.movimientosGrid= document.getElementById('multi-movimientos-grid');
  mdom.esperandoRival = document.getElementById('multi-esperando-rival');
  mdom.indicadorTurno = document.getElementById('multi-indicador-turno');
  mdom.estadoRivalBadge = document.getElementById('multi-estado-rival-badge');
  mdom.estadoLocalBadge = document.getElementById('multi-estado-local-badge');
  mdom.btnRendirse    = document.getElementById('multi-btn-rendirse');

  // Resultado
  mdom.resultadoTitulo= document.getElementById('multi-resultado-titulo');
  mdom.resultadoSub   = document.getElementById('multi-resultado-sub');
  mdom.resultadoSprites=document.getElementById('multi-resultado-sprites');
  mdom.btnRevancha    = document.getElementById('multi-btn-revancha');
  mdom.btnVolverLobby = document.getElementById('multi-btn-volver-lobby');
}


// ─── CONEXIÓN WEBSOCKET ───────────────────────────────────────

function conectarWS() {
  if (multi.ws && multi.ws.readyState === WebSocket.OPEN) return;

  actualizarBadgeConexion('conectando');

  try {
    multi.ws = new WebSocket(MULTI_WS_URL);
  } catch (err) {
    actualizarBadgeConexion('desconectado');
    return;
  }

  // ── Conexión establecida ──
  multi.ws.onopen = () => {
    multi.conectado = true;
    multi.reintentando = false;
    actualizarBadgeConexion('conectado');
    habilitarBotonesSala();

    // Keepalive cada 25 segundos para evitar que el servidor cierre la conexión
    multi.pingInterval = setInterval(() => {
      if (multi.ws?.readyState === WebSocket.OPEN) {
        multi.ws.send(JSON.stringify({ tipo: MSG.PING }));
      }
    }, 25000);
  };

  // ── Mensaje recibido del servidor ──
  multi.ws.onmessage = (evento) => {
    let mensaje;
    try {
      mensaje = JSON.parse(evento.data);
    } catch {
      console.warn('[Multijugador] Mensaje no válido:', evento.data);
      return;
    }
    manejarMensajeServidor(mensaje);
  };

  // ── Conexión cerrada ──
  multi.ws.onclose = () => {
    multi.conectado = false;
    clearInterval(multi.pingInterval);
    actualizarBadgeConexion('desconectado');
    deshabilitarBotonesSala();

    // Reintento automático si estábamos en una batalla
    if (multi.batalla.activa && !multi.reintentando) {
      multi.reintentando = true;
      mostrarTextoMulti('⚠️ Conexión perdida. Reintentando en 3 segundos…');
      setTimeout(conectarWS, 3000);
    }
  };

  // ── Error de conexión ──
  multi.ws.onerror = () => {
    actualizarBadgeConexion('desconectado');
  };
}

function desconectarWS() {
  clearInterval(multi.pingInterval);
  if (multi.ws) {
    multi.ws.onclose = null; // evitar reintento al desconectar manualmente
    multi.ws.close();
    multi.ws = null;
  }
  multi.conectado = false;
  actualizarBadgeConexion('desconectado');
}

function enviarMensaje(tipo, datos = {}) {
  if (!multi.ws || multi.ws.readyState !== WebSocket.OPEN) {
    console.warn('[Multijugador] No hay conexión activa.');
    return;
  }
  multi.ws.send(JSON.stringify({ tipo, ...datos }));
}


// ─── MANEJADOR DE MENSAJES DEL SERVIDOR ───────────────────────

function manejarMensajeServidor(msg) {
  switch (msg.tipo) {

    // El servidor confirma la sala creada y devuelve el código
    case MSG.SALA_CREADA:
      multi.codigoSala = msg.codigo;
      mdom.codigoSala.textContent = msg.codigo;
      cambiarPantallaMulti('sala-espera');
      break;

    // El rival se conectó a la sala
    case MSG.RIVAL_LISTO:
      multi.nombreRival = msg.nombreRival;
      mdom.rivalNombreSala.textContent = msg.nombreRival;
      mdom.esperaTexto.textContent = `¡${msg.nombreRival} se conectó! Preparando batalla…`;
      document.getElementById('multi-slot-rival')
        .querySelector('.multi-jugador-badge').className = 'multi-jugador-badge listo';
      document.getElementById('multi-slot-rival')
        .querySelector('.multi-jugador-badge').textContent = 'Listo';
      document.getElementById('multi-slot-rival')
        .querySelector('.multi-jugador-avatar').textContent = '🎮';
      break;

    // El servidor confirma que ambos están listos: comienza la batalla
    case MSG.BATALLA_INICIO:
      /*
        msg contiene:
        {
          rivalNombre:     string,
          rivalPokemon:    string,   // nombre del Pokémon del rival
          rivalNivel:      number,
          rivalTipos:      string[],
          rivalMovimientos:string[],
          rivalHpMax:      number,
          primerTurno:     'local' | 'rival'
        }
      */
      prepararArenaMult(msg);
      break;

    // El servidor procesó el turno y devuelve los resultados
    case MSG.TURNO_RESULTADO:
      /*
        msg contiene:
        {
          textos:           string[],  // log de mensajes del turno
          hpLocal:          number,
          hpRival:          number,
          estadoLocal:      string|null,
          estadoRival:      string|null,
          modificadoresLocal: object,
          fin:              'victoria'|'derrota'|null
        }
      */
      procesarResultadoTurno(msg);
      break;

    // El rival ya eligió su movimiento (no se revela cuál hasta MSG.TURNO_RESULTADO)
    case MSG.RIVAL_MOVIO:
      if (multi.batalla.miTurno === false) {
        mostrarTextoMulti(`${multi.nombreRival} eligió su movimiento. Esperando tu elección…`);
        mostrarAccionesMulti();
      }
      break;

    // Fin de batalla desde el servidor
    case MSG.BATALLA_FIN:
      terminarBatallaMulti(msg.resultado, msg.razon);
      break;

    // El rival se desconectó durante la batalla
    case MSG.RIVAL_DESCONECTADO:
      mostrarTextoMulti('Tu rival se desconectó. ¡Ganaste por abandono!');
      setTimeout(() => terminarBatallaMulti('victoria', 'Rival desconectado'), 2000);
      break;

    // El rival solicitó revancha
    case MSG.REVANCHA_SOLICITADA:
      if (confirm(`${multi.nombreRival} quiere una revancha. ¿Aceptas?`)) {
        enviarMensaje(MSG.REVANCHA, { acepta: true });
      } else {
        enviarMensaje(MSG.REVANCHA, { acepta: false });
        volverAlLobby();
      }
      break;

    case MSG.ERROR:
      mostrarTextoMulti(`⚠️ Error: ${msg.mensaje}`);
      break;

    default:
      console.warn('[Multijugador] Mensaje desconocido:', msg.tipo);
  }
}


// ─── LOBBY: CREAR / UNIRSE ────────────────────────────────────

function crearSala() {
  const nombre = mdom.inputNombre.value.trim();
  if (!nombre) {
    alert('Ingresa tu nombre de entrenador primero.');
    mdom.inputNombre.focus();
    return;
  }
  if (!multi.conectado) {
    alert('No hay conexión con el servidor. Intenta de nuevo.');
    return;
  }

  multi.nombreLocal = nombre;
  multi.esCreador   = true;
  mdom.localNombre.textContent = nombre;

  const monSeleccionado = obtenerPokemonSeleccionado();
  if (!monSeleccionado) return;

  enviarMensaje(MSG.CREAR_SALA, {
    nombre,
    pokemon:     monSeleccionado.name,
    nivel:       monSeleccionado._config?.nivel || 100,
    tipos:       monSeleccionado.types.map(t => t.type.name),
    movimientos: obtenerMovimientosValidos(monSeleccionado),
    stats:       calcularStatsCompletos(
                   monSeleccionado,
                   monSeleccionado._config,
                   monSeleccionado._config?.nivel || 100
                 ),
  });

  // Guardar referencia local
  prepararDatosLocales(monSeleccionado);
}

function unirseASala() {
  const nombre = mdom.inputNombre.value.trim();
  const codigo = mdom.inputCodigo.value.trim().toUpperCase();

  if (!nombre) {
    alert('Ingresa tu nombre de entrenador primero.');
    mdom.inputNombre.focus();
    return;
  }
  if (codigo.length !== 6) {
    alert('El código debe tener exactamente 6 caracteres.');
    mdom.inputCodigo.focus();
    return;
  }
  if (!multi.conectado) {
    alert('No hay conexión con el servidor. Intenta de nuevo.');
    return;
  }

  multi.nombreLocal = nombre;
  multi.esCreador   = false;
  multi.codigoSala  = codigo;

  const monSeleccionado = obtenerPokemonSeleccionado();
  if (!monSeleccionado) return;

  enviarMensaje(MSG.UNIRSE_SALA, {
    codigo,
    nombre,
    pokemon:     monSeleccionado.name,
    nivel:       monSeleccionado._config?.nivel || 100,
    tipos:       monSeleccionado.types.map(t => t.type.name),
    movimientos: obtenerMovimientosValidos(monSeleccionado),
    stats:       calcularStatsCompletos(
                   monSeleccionado,
                   monSeleccionado._config,
                   monSeleccionado._config?.nivel || 100
                 ),
  });

  prepararDatosLocales(monSeleccionado);
  cambiarPantallaMulti('sala-espera');
  mdom.codigoSala.textContent = codigo;
  mdom.esperaTexto.textContent = `Uniéndose a la sala ${codigo}…`;
}

function cancelarSala() {
  desconectarWS();
  multi.codigoSala = null;
  multi.esCreador  = false;
  cambiarPantallaMulti('lobby');
  // Reconectar para que los botones vuelvan a habilitarse
  setTimeout(conectarWS, 500);
}


// ─── PREPARAR DATOS LOCALES ANTES DE LA BATALLA ──────────────

function prepararDatosLocales(mon) {
  const cfg  = mon._config || {};
  const lvl  = cfg.nivel || 100;
  const stats = calcularStatsCompletos(mon, cfg, lvl);

  multi.batalla.local.pokemon     = mon;
  multi.batalla.local.nombre      = cfg.apodo || mon.name;
  multi.batalla.local.nivel       = lvl;
  multi.batalla.local.stats       = stats;
  multi.batalla.local.hpMax       = stats.hp;
  multi.batalla.local.hpActual    = stats.hp;
  multi.batalla.local.tipos       = mon.types.map(t => t.type.name);
  multi.batalla.local.movimientos = obtenerMovimientosValidos(mon);
  multi.batalla.local.estado      = null;
  multi.batalla.local.modificadores = { atk:0, def:0, spa:0, spd:0, spe:0 };
}

function obtenerMovimientosValidos(mon) {
  const cfg = mon._config || {};
  const movs = (cfg.movimientos || []).filter(Boolean).slice(0, 4);
  if (movs.length) return movs;
  return mon.moves.slice(0, 4).map(m => m.move.name);
}

function obtenerPokemonSeleccionado() {
  // Accede al equipo global de script.js
  const equipo = (typeof estado !== 'undefined' ? estado.equipo : []).filter(Boolean);
  if (!equipo.length) {
    alert('No tienes Pokémon en tu equipo. Ve al Teambuilder primero.');
    return null;
  }
  const mon = equipo[multi.indiceSeleccionado] || equipo[0];
  return mon;
}


// ─── ARENA MULTIJUGADOR ───────────────────────────────────────

function prepararArenaMult(msg) {
  // Configurar datos del rival (recibidos del servidor)
  multi.nombreRival = msg.rivalNombre;
  multi.batalla.rival.nombre      = msg.rivalPokemon;
  multi.batalla.rival.nivel       = msg.rivalNivel;
  multi.batalla.rival.tipos       = msg.rivalTipos;
  multi.batalla.rival.movimientos = msg.rivalMovimientos;
  multi.batalla.rival.hpMax       = msg.rivalHpMax;
  multi.batalla.rival.hpActual    = msg.rivalHpMax;
  multi.batalla.rival.estado      = null;

  multi.batalla.activa  = true;
  multi.batalla.miTurno = msg.primerTurno === 'local';

  cambiarPantallaMulti('arena');
  renderizarArenaMulti();

  const orden = multi.batalla.miTurno
    ? '¡Tú atacas primero!'
    : `¡${multi.nombreRival} ataca primero!`;

  mostrarTextoMulti(`¡${msg.rivalPokemon} apareció! ${orden}`)
    .then(() => {
      if (multi.batalla.miTurno) mostrarAccionesMulti();
      else mostrarEsperandoRival();
    });
}

function renderizarArenaMulti() {
  const local = multi.batalla.local;
  const rival = multi.batalla.rival;

  // Sprites
  mdom.spriteRival.src = urlSpriteBatalla(rival.nombre, 'gen5');
  mdom.spriteRival.onerror = function () {
    this.src = urlSpriteBatalla(rival.nombre, 'dex');
  };
  mdom.spriteLocal.src = urlSpriteBatallaEspalda(local.pokemon.name);
  mdom.spriteLocal.onerror = function () {
    this.src = urlSpriteBatalla(local.pokemon.name, 'dex');
  };

  // Info
  mdom.nombreRival.textContent = rival.nombre;
  mdom.nivelRival.textContent  = `Nv.${rival.nivel}`;
  mdom.nombreLocal.textContent = local.nombre;
  mdom.nivelLocal.textContent  = `Nv.${local.nivel}`;

  actualizarBarrasHPMulti();
  renderizarMovimientosMulti();
}

function actualizarBarrasHPMulti() {
  const local = multi.batalla.local;
  const rival = multi.batalla.rival;

  const pctLocal = Math.max(0, local.hpActual / local.hpMax);
  mdom.hpLocalBarra.style.width = `${pctLocal * 100}%`;
  mdom.hpLocalBarra.className   = `hp-relleno ${colorBarraMulti(pctLocal)}`;
  mdom.hpLocalNums.textContent  = `${Math.max(0, local.hpActual)} / ${local.hpMax}`;

  const pctRival = Math.max(0, rival.hpActual / rival.hpMax);
  mdom.hpRivalBarra.style.width = `${pctRival * 100}%`;
  mdom.hpRivalBarra.className   = `hp-relleno ${colorBarraMulti(pctRival)}`;
}

function colorBarraMulti(pct) {
  if (pct > 0.5) return 'verde';
  if (pct > 0.2) return 'amarillo';
  return 'rojo';
}

function renderizarMovimientosMulti() {
  mdom.movimientosGrid.innerHTML = '';
  multi.batalla.local.movimientos.forEach(mov => {
    // Usa las mismas constantes de battle.js
    const tipo  = TIPOS_MOVIMIENTO[mov]  || 'normal';
    const poder = PODER_MOVIMIENTO[mov]  ?? '—';
    const btn   = document.createElement('button');
    btn.className = `btn-movimiento tipo-bg-${tipo}`;
    btn.innerHTML = `
      <span class="mov-nombre">${mov.replace(/-/g, ' ')}</span>
      <span class="mov-detalle">
        <span class="mov-tipo">${tipo}</span> ·
        <span class="mov-poder">P:${poder}</span>
      </span>
    `;
    btn.addEventListener('click', () => elegirMovimientoMulti(mov));
    mdom.movimientosGrid.appendChild(btn);
  });
}


// ─── TURNO MULTIJUGADOR ───────────────────────────────────────

function elegirMovimientoMulti(movimiento) {
  if (!multi.batalla.activa) return;

  // Guardar la elección local y enviarla al servidor
  multi.batalla.movimientoElegido = movimiento;

  ocultarAccionesMulti();
  mostrarEsperandoRival();
  mostrarTextoMulti(`Elegiste ${movimiento.replace(/-/g, ' ')}. Esperando a ${multi.nombreRival}…`);

  enviarMensaje(MSG.MOVIMIENTO, { movimiento });
}

async function procesarResultadoTurno(msg) {
  /*
    El servidor procesa ambos movimientos y devuelve el resultado.
    Mostramos los textos secuencialmente y actualizamos el estado.
  */
  ocultarAccionesMulti();

  // Actualizar HP
  multi.batalla.local.hpActual = msg.hpLocal;
  multi.batalla.rival.hpActual = msg.hpRival;
  actualizarBarrasHPMulti();

  // Actualizar estados
  multi.batalla.local.estado = msg.estadoLocal;
  multi.batalla.rival.estado = msg.estadoRival;
  actualizarBadgeEstadoMulti('local');
  actualizarBadgeEstadoMulti('rival');

  // Mostrar textos del turno uno a uno
  for (const texto of (msg.textos || [])) {
    await mostrarTextoMulti(texto, 1100);
  }

  // ¿Terminó la batalla?
  if (msg.fin) {
    await terminarBatallaMulti(msg.fin === 'victoria' ? 'victoria' : 'derrota');
    return;
  }

  // Siguiente turno
  multi.batalla.miTurno = msg.siguienteTurnoLocal;
  if (multi.batalla.miTurno) {
    mostrarAccionesMulti();
    mdom.indicadorTurno.classList.remove('oculto');
  } else {
    mdom.indicadorTurno.classList.add('oculto');
    mostrarEsperandoRival();
    mostrarTextoMulti(`Esperando el movimiento de ${multi.nombreRival}…`);
  }
}

async function rendirseMulti() {
  if (!multi.batalla.activa) return;
  if (!confirm('¿Seguro que quieres rendirte? Contará como derrota.')) return;
  enviarMensaje(MSG.RENDIRSE);
  await terminarBatallaMulti('derrota', 'Te rendiste.');
}


// ─── FIN DE BATALLA MULTIJUGADOR ─────────────────────────────

async function terminarBatallaMulti(resultado, razon = '') {
  multi.batalla.activa = false;
  mdom.indicadorTurno.classList.add('oculto');
  ocultarAccionesMulti();

  const local = multi.batalla.local;
  const rival = multi.batalla.rival;

  if (resultado === 'victoria') {
    mdom.resultadoTitulo.textContent = '¡Victoria!';
    mdom.resultadoSub.textContent    = razon || `¡Derrotaste a ${multi.nombreRival}!`;
  } else {
    mdom.resultadoTitulo.textContent = 'Derrota';
    mdom.resultadoSub.textContent    = razon || `${multi.nombreRival} ganó esta vez.`;
  }

  mdom.resultadoSprites.innerHTML = `
    <img src="${urlSpriteBatalla(local.pokemon?.name || 'pikachu', 'gen5')}"
         alt="${local.nombre}"
         onerror="this.src='${urlSpriteBatalla(local.pokemon?.name || 'pikachu', 'dex')}'" />
    <span style="font-size:2rem">⚔️</span>
    <img src="${urlSpriteBatalla(rival.nombre || 'pikachu', 'gen5')}"
         alt="${rival.nombre}"
         onerror="this.src='${urlSpriteBatalla(rival.nombre || 'pikachu', 'dex')}'" />
  `;

  await esperar(600);
  cambiarPantallaMulti('resultado');
}

function pedirRevancha() {
  enviarMensaje(MSG.REVANCHA, { acepta: true });
  mdom.btnRevancha.disabled = true;
  mdom.btnRevancha.textContent = '⏳ Esperando respuesta…';
}

function volverAlLobby() {
  desconectarWS();
  multi.batalla.activa = false;
  multi.codigoSala     = null;
  cambiarPantallaMulti('lobby');
  // Reconectar para que el lobby vuelva a funcionar
  setTimeout(conectarWS, 500);
}


// ─── HELPERS UI ───────────────────────────────────────────────

function cambiarPantallaMulti(id) {
  // id: 'lobby' | 'sala-espera' | 'arena' | 'resultado'
  ['lobby', 'sala-espera', 'arena', 'resultado'].forEach(p => {
    const el = document.getElementById(`multi-${p}`);
    if (el) el.classList.remove('activa');
  });
  const destino = document.getElementById(`multi-${id}`);
  if (destino) destino.classList.add('activa');
}

function mostrarTextoMulti(texto, duracion = 1000) {
  if (!mdom.logBatalla || !mdom.textoBatalla) return Promise.resolve();
  mdom.logBatalla.classList.remove('oculto');
  mdom.accionesBatalla.classList.add('oculto');
  mdom.esperandoRival.classList.add('oculto');

  return new Promise(resolve => {
    mdom.textoBatalla.textContent = texto;
    mdom.textoBatalla.classList.remove('texto-aparece');
    void mdom.textoBatalla.offsetWidth;
    mdom.textoBatalla.classList.add('texto-aparece');
    setTimeout(resolve, duracion);
  });
}

function mostrarAccionesMulti() {
  if (!mdom.logBatalla) return;
  mdom.logBatalla.classList.add('oculto');
  mdom.esperandoRival.classList.add('oculto');
  mdom.accionesBatalla.classList.remove('oculto');
  mdom.indicadorTurno.classList.remove('oculto');
}

function ocultarAccionesMulti() {
  if (!mdom.accionesBatalla) return;
  mdom.accionesBatalla.classList.add('oculto');
  mdom.esperandoRival.classList.add('oculto');
  mdom.logBatalla.classList.remove('oculto');
  mdom.indicadorTurno.classList.add('oculto');
}

function mostrarEsperandoRival() {
  if (!mdom.esperandoRival) return;
  mdom.accionesBatalla.classList.add('oculto');
  mdom.logBatalla.classList.add('oculto');
  mdom.esperandoRival.classList.remove('oculto');
}

function actualizarBadgeEstadoMulti(lado) {
  const badge  = lado === 'local' ? mdom.estadoLocalBadge : mdom.estadoRivalBadge;
  const estado = lado === 'local'
    ? multi.batalla.local.estado
    : multi.batalla.rival.estado;

  if (!badge) return;
  if (!estado) {
    badge.classList.add('oculto');
    badge.textContent = '';
    return;
  }
  const etiquetas = {
    paralizado: 'PAR', envenenado: 'VEN', quemado: 'QUE',
    dormido: 'DOR', congelado: 'CON',
  };
  badge.textContent = etiquetas[estado] || estado.slice(0, 3).toUpperCase();
  badge.className   = `info-estado-badge estado-${estado}`;
}

function actualizarBadgeConexion(estado) {
  if (!mdom.estadoConexion) return;
  mdom.estadoConexion.className = `multi-conexion-badge ${estado}`;
  const textos = {
    conectado:    '✅ Conectado al servidor',
    conectando:   '⏳ Conectando…',
    desconectado: '❌ Desconectado del servidor',
  };
  mdom.textoConexion.textContent = textos[estado] || estado;
}

function habilitarBotonesSala() {
  if (mdom.btnCrear)   mdom.btnCrear.disabled  = false;
  if (mdom.btnUnirse)  mdom.btnUnirse.disabled  = false;
}

function deshabilitarBotonesSala() {
  if (mdom.btnCrear)   mdom.btnCrear.disabled  = true;
  if (mdom.btnUnirse)  mdom.btnUnirse.disabled  = true;
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// ─── RENDERIZAR SLOTS DEL EQUIPO EN EL LOBBY ─────────────────

function renderizarSlotsLobbyMulti() {
  if (!mdom.slotsEquipo) return;

  const equipo = (typeof estado !== 'undefined' ? estado.equipo : []).filter(Boolean);
  mdom.slotsEquipo.innerHTML = '';

  if (!equipo.length) {
    mdom.slotsEquipo.innerHTML = `
      <div class="sin-equipo">
        <p>No tienes Pokémon en tu equipo.</p>
        <p>Ve al <strong>Teambuilder</strong> para agregar Pokémon primero.</p>
      </div>`;
    deshabilitarBotonesSala();
    return;
  }

  equipo.forEach((mon, i) => {
    const cfg  = mon._config || {};
    const slot = document.createElement('div');
    slot.className = `batalla-slot-sel ${i === multi.indiceSeleccionado ? 'seleccionado' : ''}`;
    slot.dataset.indice = i;
    slot.innerHTML = `
      <img src="${urlSpriteBatalla(mon.name, 'gen5')}"
           alt="${mon.name}"
           onerror="this.src='${urlSpriteBatalla(mon.name, 'dex')}'" />
      <span>${cfg.apodo || mon.name}</span>
    `;
    slot.addEventListener('click', () => {
      document.querySelectorAll('#multi-slots-equipo .batalla-slot-sel')
        .forEach(s => s.classList.remove('seleccionado'));
      slot.classList.add('seleccionado');
      multi.indiceSeleccionado = i;
    });
    mdom.slotsEquipo.appendChild(slot);
  });

  // Solo habilitar si hay conexión
  if (multi.conectado) habilitarBotonesSala();
}


// ─── EVENTOS DE BOTONES ───────────────────────────────────────

function vincularEventosMulti() {
  mdom.btnCrear.addEventListener('click', crearSala);
  mdom.btnUnirse.addEventListener('click', unirseASala);
  mdom.btnCancelarSala.addEventListener('click', cancelarSala);
  mdom.btnRendirse.addEventListener('click', rendirseMulti);
  mdom.btnRevancha.addEventListener('click', pedirRevancha);
  mdom.btnVolverLobby.addEventListener('click', volverAlLobby);

  mdom.btnCopiarCodigo.addEventListener('click', () => {
    navigator.clipboard.writeText(multi.codigoSala || '').then(() => {
      mdom.btnCopiarCodigo.textContent = '✅';
      setTimeout(() => { mdom.btnCopiarCodigo.textContent = '📋'; }, 1500);
    });
  });

  // Validar input del código: solo letras y números, mayúsculas
  mdom.inputCodigo.addEventListener('input', () => {
    mdom.inputCodigo.value = mdom.inputCodigo.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  // Habilitar botones cuando el nombre no está vacío
  mdom.inputNombre.addEventListener('input', () => {
    const tieneNombre = mdom.inputNombre.value.trim().length > 0;
    if (multi.conectado) {
      mdom.btnCrear.disabled  = !tieneNombre;
      mdom.btnUnirse.disabled = !tieneNombre;
    }
  });
}


// INICIALIZACIÓN DEL MÓDULO MULTIJUGADOR

(function inicializarMultijugador() {
  const intentar = () => {
    const pagina = document.getElementById('pagina-multijugador');
    if (!pagina) { setTimeout(intentar, 100); return; }

    cachearDOMMulti();
    vincularEventosMulti();

    // Intentar conectar al servidor al cargar la página
    conectarWS();

    // Actualizar slots cuando el usuario navega a la sección
    document.addEventListener('click', e => {
      const btn = e.target.closest('.boton-nav');
      if (btn?.dataset.pagina === 'multijugador') {
        setTimeout(renderizarSlotsLobbyMulti, 50);
      }
    });

    // Si ya está activa al cargar
    setTimeout(renderizarSlotsLobbyMulti, 200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', intentar);
  } else {
    intentar();
  }
})();
