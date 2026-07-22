/*
  server.js  —  Servidor WebSocket para Batalla Pokémon Multijugador
  Ejecutar con:  node server.js
  Puerto por defecto: 3000
*/

const { WebSocketServer } = require('ws');

const PORT   = process.env.PORT || 3000;
const wss    = new WebSocketServer({ port: PORT });
const salas  = new Map();   // codigo → { jugadorA, jugadorB }

console.log(`[Servidor] Escuchando en ws://localhost:${PORT}`);

// ── Generar código único de 6 caracteres ──────────────────────
function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do {
    codigo = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (salas.has(codigo));
  return codigo;
}

// ── Enviar mensaje a un cliente ───────────────────────────────
function enviar(ws, tipo, datos = {}) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ tipo, ...datos }));
  }
}

// ── Conexión de un cliente ────────────────────────────────────
wss.on('connection', (ws) => {
  ws.salaActual = null;
  ws.datosJugador = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.tipo) {

      // Jugador A crea una sala
      case 'CREAR_SALA': {
        const codigo = generarCodigo();
        salas.set(codigo, { jugadorA: ws, jugadorB: null });
        ws.salaActual     = codigo;
        ws.datosJugador   = msg;   // nombre, pokemon, stats, etc.
        ws.esJugadorA     = true;
        enviar(ws, 'SALA_CREADA', { codigo });
        console.log(`[Sala ${codigo}] Creada por ${msg.nombre}`);
        break;
      }

      // Jugador B se une con código
      case 'UNIRSE_SALA': {
        const sala = salas.get(msg.codigo);
        if (!sala) {
          enviar(ws, 'ERROR', { mensaje: 'Código de sala no encontrado.' });
          return;
        }
        if (sala.jugadorB) {
          enviar(ws, 'ERROR', { mensaje: 'La sala ya está llena.' });
          return;
        }

        sala.jugadorB       = ws;
        ws.salaActual       = msg.codigo;
        ws.datosJugador     = msg;
        ws.esJugadorA       = false;

        // Notificar a A que B llegó
        enviar(sala.jugadorA, 'RIVAL_LISTO', { nombreRival: msg.nombre });

        // Determinar quién va primero (por velocidad declarada)
        const speA = sala.jugadorA.datosJugador.stats?.spe ?? 50;
        const speB = msg.stats?.spe ?? 50;
        const aPrimero = speA >= speB;

        // Notificar a ambos que empieza la batalla
        const datosParaA = {
          rivalNombre:      msg.nombre,
          rivalPokemon:     msg.pokemon,
          rivalNivel:       msg.nivel,
          rivalTipos:       msg.tipos,
          rivalMovimientos: msg.movimientos,
          rivalHpMax:       msg.stats?.hp ?? 250,
          primerTurno:      aPrimero ? 'local' : 'rival',
        };
        const datosParaB = {
          rivalNombre:      sala.jugadorA.datosJugador.nombre,
          rivalPokemon:     sala.jugadorA.datosJugador.pokemon,
          rivalNivel:       sala.jugadorA.datosJugador.nivel,
          rivalTipos:       sala.jugadorA.datosJugador.tipos,
          rivalMovimientos: sala.jugadorA.datosJugador.movimientos,
          rivalHpMax:       sala.jugadorA.datosJugador.stats?.hp ?? 250,
          primerTurno:      aPrimero ? 'rival' : 'local',
        };

        enviar(sala.jugadorA, 'BATALLA_INICIO', datosParaA);
        enviar(sala.jugadorB, 'BATALLA_INICIO', datosParaB);

        // Preparar estado de turno
        sala.movimientos = {};
        sala.turno       = 1;
        sala.hpA         = sala.jugadorA.datosJugador.stats?.hp ?? 250;
        sala.hpB         = msg.stats?.hp ?? 250;
        sala.estadoA     = null;
        sala.estadoB     = null;

        console.log(`[Sala ${msg.codigo}] Batalla iniciada: ${sala.jugadorA.datosJugador.nombre} vs ${msg.nombre}`);
        break;
      }

      // Un jugador envía su movimiento
      case 'MOVIMIENTO': {
        const sala = salas.get(ws.salaActual);
        if (!sala) return;

        const llave = ws.esJugadorA ? 'A' : 'B';
        sala.movimientos[llave] = msg.movimiento;

        // Avisar al rival que este jugador ya eligió
        const rival = ws.esJugadorA ? sala.jugadorB : sala.jugadorA;
        enviar(rival, 'RIVAL_MOVIO', {});

        // Si ambos eligieron, procesar el turno
        if (sala.movimientos.A && sala.movimientos.B) {
          procesarTurno(sala);
        }
        break;
      }

      // Un jugador se rinde
      case 'RENDIRSE': {
        const sala = salas.get(ws.salaActual);
        if (!sala) return;
        const rival = ws.esJugadorA ? sala.jugadorB : sala.jugadorA;
        enviar(rival, 'BATALLA_FIN', { resultado: 'victoria', razon: 'El rival se rindió.' });
        salas.delete(ws.salaActual);
        break;
      }

      // Revancha
      case 'REVANCHA': {
        const sala = salas.get(ws.salaActual);
        if (!sala) return;
        if (msg.acepta) {
          const rival = ws.esJugadorA ? sala.jugadorB : sala.jugadorA;
          enviar(rival, 'REVANCHA_SOLICITADA', {});
          // Aquí podrías reiniciar sala.hpA, sala.hpB, etc.
        }
        break;
      }

      case 'PING':
        enviar(ws, 'PONG', {});
        break;
    }
  });

  // Cliente desconectado
  ws.on('close', () => {
    if (!ws.salaActual) return;
    const sala = salas.get(ws.salaActual);
    if (!sala) return;
    const rival = ws.esJugadorA ? sala.jugadorB : sala.jugadorA;
    if (rival) enviar(rival, 'RIVAL_DESCONECTADO', {});
    salas.delete(ws.salaActual);
    console.log(`[Sala ${ws.salaActual}] Cerrada por desconexión.`);
  });
});


// ── Procesar turno ────────────────────────────────────────────
function procesarTurno(sala) {
  const movA = sala.movimientos.A;
  const movB = sala.movimientos.B;
  sala.movimientos = {};   // limpiar para el próximo turno

  const statsA = sala.jugadorA.datosJugador.stats;
  const statsB = sala.jugadorB.datosJugador.stats;

  // Tabla de poderes básicos (coincide con PODER_MOVIMIENTO de battle.js)
  const PODER = {
    'tackle':40,'scratch':40,'pound':40,'cut':50,'slash':70,'bite':60,
    'headbutt':70,'body-slam':85,'double-edge':120,'hyper-beam':150,
    'surf':90,'flamethrower':90,'thunderbolt':90,'ice-beam':90,
    'psychic':90,'shadow-ball':80,'energy-ball':90,'focus-blast':120,
    'earthquake':100,'rock-slide':75,'iron-head':80,'close-combat':120,
    'leaf-blade':90,'dragon-claw':80,'crunch':80,'stone-edge':100,
    'fire-blast':110,'blizzard':110,'thunder':110,'giga-drain':75,
    'dark-pulse':80,'dragon-pulse':85,'water-gun':40,'hydro-pump':110,
    'ember':40,'thunder-shock':40,'x-scissor':80,'aerial-ace':60,
    'brave-bird':120,'flash-cannon':80,
  };

  const textosA = [];
  const textosB = [];

  // ── Calcular daño de A a B ───────────────────────────────────
  const danioAaB = calcularDanioSimple(movA, statsA, statsB, PODER);
  if (danioAaB > 0) sala.hpB = Math.max(0, sala.hpB - danioAaB);
  textosA.push(`${sala.jugadorA.datosJugador.nombre} usó ${movA.replace(/-/g,' ')}! (−${danioAaB} HP)`);

  // ── Calcular daño de B a A ───────────────────────────────────
  const danioBaA = calcularDanioSimple(movB, statsB, statsA, PODER);
  if (danioBaA > 0) sala.hpA = Math.max(0, sala.hpA - danioBaA);
  textosB.push(`${sala.jugadorB.datosJugador.nombre} usó ${movB.replace(/-/g,' ')}! (−${danioBaA} HP)`);

  // ── Determinar si acabó la batalla ───────────────────────────
  let finA = null;
  let finB = null;
  if (sala.hpB <= 0) { finA = 'victoria'; finB = 'derrota'; }
  if (sala.hpA <= 0) { finA = 'derrota';  finB = 'victoria'; }

  // ── Enviar resultado a A ─────────────────────────────────────
  enviar(sala.jugadorA, 'TURNO_RESULTADO', {
    textos:              [...textosA, ...textosB],
    hpLocal:             sala.hpA,
    hpRival:             sala.hpB,
    estadoLocal:         sala.estadoA,
    estadoRival:         sala.estadoB,
    siguienteTurnoLocal: statsA.spe >= statsB.spe,
    fin:                 finA,
  });

  // ── Enviar resultado a B ─────────────────────────────────────
  enviar(sala.jugadorB, 'TURNO_RESULTADO', {
    textos:              [...textosB, ...textosA],
    hpLocal:             sala.hpB,
    hpRival:             sala.hpA,
    estadoLocal:         sala.estadoB,
    estadoRival:         sala.estadoA,
    siguienteTurnoLocal: statsB.spe >= statsA.spe,
    fin:                 finB,
  });

  sala.turno++;
  if (finA || finB) salas.delete(sala.jugadorA.salaActual);
}

function calcularDanioSimple(movimiento, statsAt, statsDef, PODER) {
  const poder = PODER[movimiento] ?? 0;
  if (!poder) return 0;
  const atk   = statsAt.atk ?? 100;
  const def   = statsDef.def ?? 100;
  const nivel = 100;
  const azar  = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(
    ((2 * nivel / 5 + 2) * poder * atk / def / 50 + 2) * azar
  ));
}