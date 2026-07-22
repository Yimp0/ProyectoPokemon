/*
  ═══════════════════════════════════════════════════════════════
  battle.js  —  Sistema de Batalla de Prueba
  Pokémon Teambuilder · Sección "Batalla de Prueba"
  ═══════════════════════════════════════════════════════════════
*/

// ─── CONSTANTES ────────────────────────────────────────────────

const URL_SPRITE_ANIM_FRONT = 'https://play.pokemonshowdown.com/sprites/gen5ani/';
const URL_SPRITE_ANIM_BACK  = 'https://play.pokemonshowdown.com/sprites/gen5ani-back/';
const URL_SPRITE_STATIC_DEX = 'https://play.pokemonshowdown.com/sprites/dex/';

const EFECTIVIDAD_TIPOS = {
  normal:   { rock:0.5, ghost:0, steel:0.5 },
  fire:     { fire:0.5, water:0.5, grass:2, ice:2, bug:2, rock:0.5, dragon:0.5, steel:2 },
  water:    { fire:2, water:0.5, grass:0.5, ground:2, rock:2, dragon:0.5 },
  grass:    { fire:0.5, water:2, grass:0.5, poison:0.5, ground:2, flying:0.5, bug:0.5, rock:2, dragon:0.5, steel:0.5 },
  electric: { water:2, electric:0.5, grass:0.5, ground:0, flying:2, dragon:0.5 },
  ice:      { fire:0.5, water:0.5, grass:2, ice:0.5, ground:2, flying:2, dragon:2, steel:0.5 },
  fighting: { normal:2, ice:2, poison:0.5, flying:0.5, psychic:0.5, bug:0.5, rock:2, ghost:0, dark:2, steel:2, fairy:0.5 },
  poison:   { grass:2, poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, fairy:2 },
  ground:   { fire:2, electric:2, grass:0.5, poison:2, flying:0, bug:0.5, rock:2, steel:2 },
  flying:   { electric:0.5, grass:2, fighting:2, bug:2, rock:0.5, steel:0.5 },
  psychic:  { fighting:2, poison:2, psychic:0.5, dark:0, steel:0.5 },
  bug:      { fire:0.5, grass:2, fighting:0.5, poison:0.5, flying:0.5, psychic:2, ghost:0.5, dark:2, steel:0.5, fairy:0.5 },
  rock:     { fire:2, ice:2, fighting:0.5, ground:0.5, flying:2, bug:2, steel:0.5 },
  ghost:    { normal:0, psychic:2, ghost:2, dark:0.5 },
  dragon:   { dragon:2, steel:0.5, fairy:0 },
  dark:     { fighting:0.5, psychic:2, ghost:2, dark:0.5, fairy:0.5 },
  steel:    { fire:0.5, water:0.5, electric:0.5, ice:2, rock:2, steel:0.5, fairy:2 },
  fairy:    { fire:0.5, fighting:2, poison:0.5, dragon:2, dark:2, steel:0.5 },
};

const CATEGORIA_MOVIMIENTO = {
  'tackle':'physical','scratch':'physical','pound':'physical','cut':'physical',
  'slash':'physical','bite':'physical','headbutt':'physical','body-slam':'physical',
  'double-edge':'physical','hyper-beam':'special','surf':'special','flamethrower':'special',
  'thunderbolt':'special','ice-beam':'special','psychic':'special','shadow-ball':'special',
  'energy-ball':'special','focus-blast':'special','aura-sphere':'special',
  'earthquake':'physical','rock-slide':'physical','iron-head':'physical',
  'close-combat':'physical','u-turn':'physical','leaf-blade':'physical',
  'dragon-claw':'physical','crunch':'physical','stone-edge':'physical',
  'fire-blast':'special','blizzard':'special','thunder':'special',
  'giga-drain':'special','dark-pulse':'special','dragon-pulse':'special',
  'swords-dance':'status','nasty-plot':'status','calm-mind':'status','recover':'status',
  'roost':'status','protect':'status','substitute':'status','toxic':'status',
};

const TIPOS_MOVIMIENTO = {
  'tackle':'normal','scratch':'normal','pound':'normal','body-slam':'normal','double-edge':'normal','hyper-beam':'normal',
  'surf':'water','water-gun':'water','hydro-pump':'water',
  'flamethrower':'fire','fire-blast':'fire','ember':'fire',
  'thunderbolt':'electric','thunder':'electric','thunder-shock':'electric',
  'ice-beam':'ice','blizzard':'ice','powder-snow':'ice',
  'psychic':'psychic','psybeam':'psychic',
  'shadow-ball':'ghost','dark-pulse':'dark','crunch':'dark','bite':'dark',
  'earthquake':'ground','magnitude':'ground',
  'rock-slide':'rock','stone-edge':'rock',
  'leaf-blade':'grass','energy-ball':'grass','giga-drain':'grass',
  'dragon-claw':'dragon','dragon-pulse':'dragon',
  'close-combat':'fighting','focus-blast':'fighting',
  'iron-head':'steel','flash-cannon':'steel',
  'u-turn':'bug','x-scissor':'bug',
  'aerial-ace':'flying','fly':'flying','brave-bird':'flying',
  'cut':'normal','slash':'normal','headbutt':'normal',
  'swords-dance':'normal','nasty-plot':'dark','calm-mind':'psychic',
  'recover':'normal','roost':'flying','protect':'normal','substitute':'normal','toxic':'poison',
};

const PODER_MOVIMIENTO = {
  'tackle':40,'scratch':40,'pound':40,'cut':50,'slash':70,'bite':60,'headbutt':70,
  'body-slam':85,'double-edge':120,'hyper-beam':150,'surf':90,'flamethrower':90,
  'thunderbolt':90,'ice-beam':90,'psychic':90,'shadow-ball':80,'energy-ball':90,
  'focus-blast':120,'aura-sphere':80,'earthquake':100,'rock-slide':75,'iron-head':80,
  'close-combat':120,'u-turn':70,'leaf-blade':90,'dragon-claw':80,'crunch':80,
  'stone-edge':100,'fire-blast':110,'blizzard':110,'thunder':110,'giga-drain':75,
  'dark-pulse':80,'dragon-pulse':85,'water-gun':40,'hydro-pump':110,'ember':40,
  'powder-snow':40,'thunder-shock':40,'psybeam':65,'magnitude':100,'x-scissor':80,
  'aerial-ace':60,'fly':90,'brave-bird':120,'flash-cannon':80,'swords-dance':0,
  'nasty-plot':0,'calm-mind':0,'recover':0,'roost':0,'protect':0,'substitute':0,'toxic':0,
};

// ─── ESTADO DE LA BATALLA ───────────────────────────────────────

const batalla = {
  activa:       false,
  turno:        1,
  turnoJugador: true,
  
  jugador: {
    pokemon:    null,
    hpActual:   0,
    hpMax:      0,
    nombre:     '',
    nivel:      100,
    stats:      {},
    tipos:      [],
    movimientos: [],
    estado:     null,   // 'paralizado','envenenado','quemado','dormido','congelado'
    dormidoTurnos: 0,
    modificadores: { atk:0, def:0, spa:0, spd:0, spe:0 },
  },
  
  enemigo: {
    pokemon:    null,
    hpActual:   0,
    hpMax:      0,
    nombre:     '',
    nivel:      50,
    stats:      {},
    tipos:      [],
    movimientos: [],
    estado:     null,
    dormidoTurnos: 0,
    modificadores: { atk:0, def:0, spa:0, spd:0, spe:0 },
  },
  
  indiceJugador:  0,
  pokemonEquipo:  [],
};


// ─── REFERENCIAS AL DOM ─────────────────────────────────────────

const dom = {};

function cachearDOM() {
  dom.pagina         = document.getElementById('pagina-batalla-prueba');
  dom.battleContainer = dom.pagina.querySelector('.battle-container');
}


// ─── CONSTRUCCIÓN DE LA UI DE BATALLA ──────────────────────────

function construirUIBatalla() {

  // Cachear referencias nuevas
  dom.inicio         = document.getElementById('batalla-inicio');
  dom.arena          = document.getElementById('batalla-arena');
  dom.resultado      = document.getElementById('batalla-resultado');
  dom.slotsEquipo    = document.getElementById('batalla-slots-equipo');
  dom.btnIniciar     = document.getElementById('btn-iniciar-batalla');
  dom.spriteEnemigo  = document.getElementById('sprite-enemigo');
  dom.spriteJugador  = document.getElementById('sprite-jugador');
  dom.nombreEnemigo  = document.getElementById('nombre-enemigo');
  dom.nivelEnemigo   = document.getElementById('nivel-enemigo');
  dom.nombreJugador  = document.getElementById('nombre-jugador');
  dom.nivelJugador   = document.getElementById('nivel-jugador');
  dom.hpRellEnemigo  = document.getElementById('hp-relleno-enemigo');
  dom.hpRellJugador  = document.getElementById('hp-relleno-jugador');
  dom.hpNumJugador   = document.getElementById('hp-numeros-jugador');
  dom.textoBatalla   = document.getElementById('texto-batalla');
  dom.logBatalla     = document.getElementById('batalla-log');
  dom.accionesBatalla= document.getElementById('acciones-batalla');
  dom.movimientosGrid= document.getElementById('movimientos-grid');
  dom.cambioPokemon  = document.getElementById('cambio-pokemon');
  dom.cambioSlots    = document.getElementById('cambio-slots');
  dom.estadoEnemBadge= document.getElementById('estado-enemigo-badge');
  dom.estadoJugBadge = document.getElementById('estado-jugador-badge');
  dom.resultadoTitulo= document.getElementById('resultado-titulo');
  dom.resultadoSub   = document.getElementById('resultado-subtitulo');
  dom.resultadoSprites=document.getElementById('resultado-sprites');

  // Eventos
  dom.btnIniciar.addEventListener('click', iniciarBatalla);
  document.getElementById('btn-cambiar').addEventListener('click', mostrarPanelCambio);
  document.getElementById('btn-cancelar-cambio').addEventListener('click', ocultarPanelCambio);
  document.getElementById('btn-huir').addEventListener('click', huirDeBatalla);
  document.getElementById('btn-nueva-batalla').addEventListener('click', reiniciarBatalla);
}


// ─── SELECCIÓN DE POKÉMON DEL EQUIPO ───────────────────────────

function renderizarSlotsSeleccion() {
  const equipo = (typeof estado !== 'undefined' ? estado.equipo : []).filter(Boolean);
  dom.slotsEquipo.innerHTML = '';

  if (!equipo.length) {
    dom.slotsEquipo.innerHTML = `
      <div class="sin-equipo">
        <p>No tienes Pokémon en tu equipo todavía.</p>
        <p>Ve al <strong>Teambuilder</strong> para agregar Pokémon primero.</p>
      </div>`;
    dom.btnIniciar.disabled = true;
    return;
  }

  batalla.pokemonEquipo = equipo;
  batalla.indiceJugador = 0;

  equipo.forEach((mon, i) => {
    const slot = document.createElement('div');
    slot.className = `batalla-slot-sel ${i === 0 ? 'seleccionado' : ''}`;
    slot.dataset.indice = i;
    slot.innerHTML = `
      <img src="${urlSpriteBatalla(mon.name, 'gen5')}" alt="${mon.name}"
           onerror="this.src='${urlSpriteBatalla(mon.name, 'dex')}'" />
      <span>${mon._config?.apodo || mon.name}</span>
    `;
    slot.addEventListener('click', () => {
      document.querySelectorAll('.batalla-slot-sel').forEach(s => s.classList.remove('seleccionado'));
      slot.classList.add('seleccionado');
      batalla.indiceJugador = i;
    });
    dom.slotsEquipo.appendChild(slot);
  });

  dom.btnIniciar.disabled = false;
}


// ─── SPRITES ───────────────────────────────────────────────────

function urlSpriteBatalla(nombre, tipo = 'gen5') {
  const n = nombre.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (tipo === 'dex') return `${URL_SPRITE_STATIC_DEX}${n}.png`;
  return `${URL_SPRITE_ANIM_FRONT}${n}.gif`;
}

function urlSpriteBatallaEspalda(nombre) {
  const n = nombre.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${URL_SPRITE_ANIM_BACK}${n}.gif`;
}


// ─── CÁLCULO DE STATS ──────────────────────────────────────────

function calcularStatBatalla(clave, base, ev = 0, iv = 31, naturaleza = 'hardy', nivel = 100) {
  const esHP = clave === 'hp';
  const nat = NATURALEZAS?.[naturaleza] || { sube: null, baja: null };
  const mod = nat.sube === clave ? 1.1 : nat.baja === clave ? 0.9 : 1;
  if (esHP) return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel / 100) + nivel + 10);
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel / 100) + 5) * mod);
}

function calcularStatsCompletos(mon, cfg, nivel) {
  const stats = {};
  mon.stats.forEach(s => {
    const clave = claveStatBatalla(s.stat.name);
    stats[clave] = calcularStatBatalla(
      clave, s.base_stat,
      cfg?.evs?.[clave] ?? 0,
      cfg?.ivs?.[clave] ?? 31,
      cfg?.naturaleza ?? 'hardy',
      nivel
    );
  });
  return stats;
}

function claveStatBatalla(nombre) {
  const m = { hp:'hp', attack:'atk', defense:'def', 'special-attack':'spa', 'special-defense':'spd', speed:'spe' };
  return m[nombre] || nombre;
}

function statConMod(valor, etapas) {
  const tabla = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 2/2, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
  const idx = Math.max(0, Math.min(12, etapas + 6));
  return Math.floor(valor * tabla[idx]);
}


// ─── POKEMON ALEATORIO ENEMIGO ─────────────────────────────────

const POOL_ENEMIGOS = [
  'gengar','garchomp','tyranitar','salamence','metagross','alakazam',
  'machamp','starmie','exeggutor','jolteon','vaporeon','flareon',
  'dragonite','lapras','snorlax','aerodactyl','arcanine','gyarados',
  'clefable','blissey','skarmory','forretress','togekiss','lucario',
  'espeon','umbreon','scizor','heracross','mismagius','hippowdon',
  'gliscor','rotom-heat','rotom-wash','reuniclus','chandelure','haxorus',
];

async function cargarEnemigoAleatorio() {
  const nombre = POOL_ENEMIGOS[Math.floor(Math.random() * POOL_ENEMIGOS.length)];
  try {
    let p;
    if (typeof obtenerPokemon === 'function') {
      p = await obtenerPokemon(nombre);
    } else {
      const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
      p = await r.json();
    }
    return p;
  } catch {
    const r = await fetch('https://pokeapi.co/api/v2/pokemon/gengar');
    return r.json();
  }
}

function elegirMovimientosEnemigo(mon) {
  const todos = mon.moves.map(m => m.move.name);
  const utiles = todos.filter(m => (PODER_MOVIMIENTO[m] ?? 0) > 0);
  const mezclados = utiles.sort(() => Math.random() - 0.5).slice(0, 4);
  if (mezclados.length < 4) {
    const relleno = todos.filter(m => !mezclados.includes(m)).slice(0, 4 - mezclados.length);
    mezclados.push(...relleno);
  }
  return mezclados.slice(0, 4);
}


// ─── INICIAR BATALLA ───────────────────────────────────────────

async function iniciarBatalla() {
  dom.btnIniciar.disabled = true;
  dom.btnIniciar.textContent = '⏳ Cargando rival…';

  const monJugador = batalla.pokemonEquipo[batalla.indiceJugador];
  const monEnemigo = await cargarEnemigoAleatorio();

  // Configurar jugador
  const cfgJ = monJugador._config || {};
  batalla.jugador.pokemon    = monJugador;
  batalla.jugador.nombre     = cfgJ.apodo || monJugador.name;
  batalla.jugador.nivel      = cfgJ.nivel || 100;
  batalla.jugador.stats      = calcularStatsCompletos(monJugador, cfgJ, batalla.jugador.nivel);
  batalla.jugador.hpMax      = batalla.jugador.stats.hp;
  batalla.jugador.hpActual   = batalla.jugador.hpMax;
  batalla.jugador.tipos      = monJugador.types.map(t => t.type.name);
  batalla.jugador.movimientos = (cfgJ.movimientos || []).filter(Boolean).slice(0, 4);
  if (!batalla.jugador.movimientos.length)
    batalla.jugador.movimientos = monJugador.moves.slice(0, 4).map(m => m.move.name);
  batalla.jugador.estado        = null;
  batalla.jugador.dormidoTurnos = 0;
  batalla.jugador.modificadores = { atk:0, def:0, spa:0, spd:0, spe:0 };

  // Configurar enemigo
  const nivelEn = batalla.enemigo.nivel;
  const statsEn = {};
  monEnemigo.stats.forEach(s => {
    const k = claveStatBatalla(s.stat.name);
    statsEn[k] = calcularStatBatalla(k, s.base_stat, 84, 31, 'hardy', nivelEn);
  });
  batalla.enemigo.pokemon    = monEnemigo;
  batalla.enemigo.nombre     = monEnemigo.name;
  batalla.enemigo.nivel      = nivelEn;
  batalla.enemigo.stats      = statsEn;
  batalla.enemigo.hpMax      = statsEn.hp;
  batalla.enemigo.hpActual   = statsEn.hp;
  batalla.enemigo.tipos      = monEnemigo.types.map(t => t.type.name);
  batalla.enemigo.movimientos = elegirMovimientosEnemigo(monEnemigo);
  batalla.enemigo.estado        = null;
  batalla.enemigo.dormidoTurnos = 0;
  batalla.enemigo.modificadores = { atk:0, def:0, spa:0, spd:0, spe:0 };

  batalla.activa = true;
  batalla.turno  = 1;

  cambiarPantalla('arena');
  renderizarArena();
  await mostrarTexto(`¡Un ${monEnemigo.name} salvaje apareció!`, 1200);
  await mostrarTexto(`¡Ve, ${batalla.jugador.nombre}!`, 1000);
  mostrarAcciones();
}


// ─── RENDERIZAR ARENA ──────────────────────────────────────────

function renderizarArena() {
  // Sprites
  dom.spriteEnemigo.src = urlSpriteBatalla(batalla.enemigo.nombre, 'gen5');
  dom.spriteEnemigo.onerror = function () {
    this.src = urlSpriteBatalla(batalla.enemigo.nombre, 'dex');
  };

  dom.spriteJugador.src = urlSpriteBatallaEspalda(batalla.jugador.pokemon.name);
  dom.spriteJugador.onerror = function () {
    this.src = urlSpriteBatalla(batalla.jugador.pokemon.name, 'dex');
  };

  // Info
  dom.nombreEnemigo.textContent = batalla.enemigo.nombre;
  dom.nivelEnemigo.textContent  = `Nv.${batalla.enemigo.nivel}`;
  dom.nombreJugador.textContent = batalla.jugador.nombre;
  dom.nivelJugador.textContent  = `Nv.${batalla.jugador.nivel}`;

  actualizarBarrasHP();
  renderizarMovimientos();
}

function actualizarBarrasHP() {
  // Enemigo
  const pctEn = Math.max(0, batalla.enemigo.hpActual / batalla.enemigo.hpMax);
  dom.hpRellEnemigo.style.width = `${pctEn * 100}%`;
  dom.hpRellEnemigo.className   = `hp-relleno ${colorBarra(pctEn)}`;

  // Jugador
  const pctJug = Math.max(0, batalla.jugador.hpActual / batalla.jugador.hpMax);
  dom.hpRellJugador.style.width = `${pctJug * 100}%`;
  dom.hpRellJugador.className   = `hp-relleno ${colorBarra(pctJug)}`;
  dom.hpNumJugador.textContent  = `${Math.max(0, batalla.jugador.hpActual)} / ${batalla.jugador.hpMax}`;
}

function colorBarra(pct) {
  if (pct > 0.5) return 'verde';
  if (pct > 0.2) return 'amarillo';
  return 'rojo';
}

function renderizarMovimientos() {
  dom.movimientosGrid.innerHTML = '';
  batalla.jugador.movimientos.forEach(mov => {
    const tipo = TIPOS_MOVIMIENTO[mov] || 'normal';
    const poder = PODER_MOVIMIENTO[mov] ?? '—';
    const btn = document.createElement('button');
    btn.className = `btn-movimiento tipo-bg-${tipo}`;
    btn.innerHTML = `
      <span class="mov-nombre">${mov.replace(/-/g,' ')}</span>
      <span class="mov-detalle"><span class="mov-tipo">${tipo}</span> · <span class="mov-poder">P:${poder}</span></span>
    `;
    btn.addEventListener('click', () => ejecutarTurnoJugador(mov));
    dom.movimientosGrid.appendChild(btn);
  });
}


// ─── SISTEMA DE TURNOS ─────────────────────────────────────────

async function ejecutarTurnoJugador(movimiento) {
  if (!batalla.activa) return;
  ocultarAcciones();

  // Estado del jugador antes de actuar
  if (batalla.jugador.estado === 'paralizado' && Math.random() < 0.25) {
    await mostrarTexto(`¡${batalla.jugador.nombre} está paralizado y no puede moverse!`, 1200);
  } else if (batalla.jugador.estado === 'dormido') {
    batalla.jugador.dormidoTurnos--;
    if (batalla.jugador.dormidoTurnos <= 0) {
      batalla.jugador.estado = null;
      actualizarBadgeEstado('jugador');
      await mostrarTexto(`¡${batalla.jugador.nombre} se despertó!`, 1000);
    } else {
      await mostrarTexto(`${batalla.jugador.nombre} está profundamente dormido…`, 1000);
      await turnoEnemigo();
      return;
    }
  } else if (batalla.jugador.estado === 'congelado') {
    if (Math.random() < 0.2) {
      batalla.jugador.estado = null;
      actualizarBadgeEstado('jugador');
      await mostrarTexto(`¡${batalla.jugador.nombre} se descongeló!`, 1000);
    } else {
      await mostrarTexto(`${batalla.jugador.nombre} está congelado y no puede moverse.`, 1000);
      await turnoEnemigo();
      return;
    }
  }

  // Determinar orden por velocidad
  const speJug = statConMod(batalla.jugador.stats.spe, batalla.jugador.modificadores.spe);
  const speEn  = statConMod(batalla.enemigo.stats.spe, batalla.enemigo.modificadores.spe);
  const jugPrimero = speJug >= speEn;

  if (jugPrimero) {
    await usarMovimiento(movimiento, batalla.jugador, batalla.enemigo, 'jugador');
    if (batalla.enemigo.hpActual <= 0) { await finBatalla('victoria'); return; }
    await turnoEnemigo();
  } else {
    await turnoEnemigo();
    if (batalla.jugador.hpActual <= 0) { await finBatalla('derrota'); return; }
    await usarMovimiento(movimiento, batalla.jugador, batalla.enemigo, 'jugador');
    if (batalla.enemigo.hpActual <= 0) { await finBatalla('victoria'); return; }
  }

  // Daño por estado al final del turno
  await procesarEstadoFinTurno(batalla.jugador, 'jugador');
  await procesarEstadoFinTurno(batalla.enemigo, 'enemigo');

  if (batalla.jugador.hpActual <= 0) { await finBatalla('derrota'); return; }
  if (batalla.enemigo.hpActual <= 0) { await finBatalla('victoria'); return; }

  batalla.turno++;
  mostrarAcciones();
}

async function turnoEnemigo() {
  if (!batalla.activa) return;

  if (batalla.enemigo.estado === 'paralizado' && Math.random() < 0.25) {
    await mostrarTexto(`¡${batalla.enemigo.nombre} está paralizado y no puede moverse!`, 1000);
    return;
  }
  if (batalla.enemigo.estado === 'dormido') {
    batalla.enemigo.dormidoTurnos--;
    if (batalla.enemigo.dormidoTurnos <= 0) {
      batalla.enemigo.estado = null;
      actualizarBadgeEstado('enemigo');
      await mostrarTexto(`¡${batalla.enemigo.nombre} se despertó!`, 1000);
    } else {
      await mostrarTexto(`${batalla.enemigo.nombre} está profundamente dormido…`, 1000);
      return;
    }
  }
  if (batalla.enemigo.estado === 'congelado') {
    if (Math.random() < 0.2) {
      batalla.enemigo.estado = null;
      actualizarBadgeEstado('enemigo');
      await mostrarTexto(`¡${batalla.enemigo.nombre} se descongeló!`, 800);
    } else {
      await mostrarTexto(`${batalla.enemigo.nombre} está congelado.`, 800);
      return;
    }
  }

  // IA simple: prioriza movimientos de daño, luego aleatorio
  const movs = batalla.enemigo.movimientos.filter(m => (PODER_MOVIMIENTO[m] ?? -1) > 0);
  const mov   = movs.length
    ? movs[Math.floor(Math.random() * movs.length)]
    : batalla.enemigo.movimientos[Math.floor(Math.random() * batalla.enemigo.movimientos.length)];

  await usarMovimiento(mov, batalla.enemigo, batalla.jugador, 'enemigo');
}


// ─── USAR MOVIMIENTO ───────────────────────────────────────────

async function usarMovimiento(nombreMov, atacante, defensor, ladoAtacante) {
  const esJugador = ladoAtacante === 'jugador';
  const nombreAt  = atacante.nombre;

  // Movimientos de estado especiales
  const poder = PODER_MOVIMIENTO[nombreMov] ?? 0;
  const cat   = CATEGORIA_MOVIMIENTO[nombreMov] || 'physical';

  if (cat === 'status') {
    await aplicarMovimientoEstado(nombreMov, atacante, defensor, esJugador);
    return;
  }

  if (!poder) {
    await mostrarTexto(`¡${nombreAt} usó ${nombreMov.replace(/-/g,' ')}! No tuvo efecto…`, 900);
    return;
  }

  // Precisión (simplificada 90%)
  if (Math.random() > 0.9) {
    await mostrarTexto(`¡${nombreAt} usó ${nombreMov.replace(/-/g,' ')}! ¡Falló!`, 900);
    animarFallo(esJugador ? 'jugador' : 'enemigo');
    return;
  }

  // Daño
  const tipoMov   = TIPOS_MOVIMIENTO[nombreMov] || 'normal';
  const efectividad = calcularEfectividad(tipoMov, defensor.tipos);
  const stab      = atacante.tipos.includes(tipoMov) ? 1.5 : 1;
  const statAt    = cat === 'special' ? 'spa' : 'atk';
  const statDef   = cat === 'special' ? 'spd' : 'def';
  const atkVal    = statConMod(atacante.stats[statAt], atacante.modificadores[statAt] || 0);
  const defVal    = statConMod(defensor.stats[statDef], defensor.modificadores[statDef] || 0);
  const critico   = Math.random() < 0.0625 ? 1.5 : 1;
  const azar      = (Math.random() * 0.15 + 0.85);
  const nivelAt   = atacante.nivel;

  const danio = Math.max(1, Math.floor(
    ((((2 * nivelAt / 5 + 2) * poder * atkVal / defVal) / 50) + 2)
    * stab * efectividad * critico * azar
  ));

  defensor.hpActual = Math.max(0, defensor.hpActual - danio);
  actualizarBarrasHP();
  animarAtaque(esJugador ? 'enemigo' : 'jugador');

  let texto = `¡${nombreAt} usó ${nombreMov.replace(/-/g,' ')}!`;
  if (critico > 1) texto += ' ¡Golpe crítico!';
  if (efectividad > 1) texto += ' ¡Es muy eficaz!';
  if (efectividad < 1 && efectividad > 0) texto += ' No es muy eficaz…';
  if (efectividad === 0) texto += ' ¡No afecta!';
  await mostrarTexto(texto, 1100);

  // Efecto secundario: quemadura/parálisis al atacar
  if (tipoMov === 'fire' && Math.random() < 0.1 && !defensor.estado) {
    defensor.estado = 'quemado';
    actualizarBadgeEstado(esJugador ? 'enemigo' : 'jugador');
    await mostrarTexto(`¡${defensor.nombre} quedó quemado!`, 800);
  }
  if (tipoMov === 'electric' && Math.random() < 0.1 && !defensor.estado) {
    defensor.estado = 'paralizado';
    actualizarBadgeEstado(esJugador ? 'enemigo' : 'jugador');
    await mostrarTexto(`¡${defensor.nombre} quedó paralizado!`, 800);
  }
  if (tipoMov === 'ice' && Math.random() < 0.1 && !defensor.estado) {
    defensor.estado = 'congelado';
    actualizarBadgeEstado(esJugador ? 'enemigo' : 'jugador');
    await mostrarTexto(`¡${defensor.nombre} quedó congelado!`, 800);
  }
}

function calcularEfectividad(tipoMov, tiposDefensor) {
  let mult = 1;
  tiposDefensor.forEach(td => {
    const fila = EFECTIVIDAD_TIPOS[tipoMov];
    if (fila && fila[td] !== undefined) mult *= fila[td];
  });
  return mult;
}

async function aplicarMovimientoEstado(mov, atacante, defensor, esJugador) {
  const nombreAt = atacante.nombre;
  if (mov === 'swords-dance') {
    atacante.modificadores.atk = Math.min(6, (atacante.modificadores.atk || 0) + 2);
    await mostrarTexto(`¡${nombreAt} usó Danza Espada! ¡Su Ataque subió mucho!`, 1000);
  } else if (mov === 'nasty-plot') {
    atacante.modificadores.spa = Math.min(6, (atacante.modificadores.spa || 0) + 2);
    await mostrarTexto(`¡${nombreAt} usó Maquinación! ¡Su At. Esp. subió mucho!`, 1000);
  } else if (mov === 'calm-mind') {
    atacante.modificadores.spa = Math.min(6, (atacante.modificadores.spa || 0) + 1);
    atacante.modificadores.spd = Math.min(6, (atacante.modificadores.spd || 0) + 1);
    await mostrarTexto(`¡${nombreAt} usó Mente Fresca! Sus stats subieron.`, 1000);
  } else if (mov === 'recover' || mov === 'roost') {
    const curado = Math.floor(atacante.hpMax / 2);
    atacante.hpActual = Math.min(atacante.hpMax, atacante.hpActual + curado);
    actualizarBarrasHP();
    await mostrarTexto(`¡${nombreAt} usó ${mov === 'roost' ? 'Picadura' : 'Recuperación'} y recuperó PS!`, 1000);
  } else if (mov === 'toxic' && !defensor.estado) {
    defensor.estado = 'envenenado';
    actualizarBadgeEstado(esJugador ? 'enemigo' : 'jugador');
    await mostrarTexto(`¡${defensor.nombre} quedó gravemente envenenado!`, 1000);
  } else if (mov === 'protect') {
    await mostrarTexto(`¡${nombreAt} se protegió!`, 900);
  } else {
    await mostrarTexto(`¡${nombreAt} usó ${mov.replace(/-/g,' ')}!`, 900);
  }
}

async function procesarEstadoFinTurno(combatiente, lado) {
  if (combatiente.estado === 'quemado') {
    const daño = Math.max(1, Math.floor(combatiente.hpMax / 16));
    combatiente.hpActual = Math.max(0, combatiente.hpActual - daño);
    actualizarBarrasHP();
    await mostrarTexto(`¡${combatiente.nombre} sufre por la quemadura!`, 800);
  } else if (combatiente.estado === 'envenenado') {
    const daño = Math.max(1, Math.floor(combatiente.hpMax / 8));
    combatiente.hpActual = Math.max(0, combatiente.hpActual - daño);
    actualizarBarrasHP();
    await mostrarTexto(`¡${combatiente.nombre} sufre por el veneno!`, 800);
  }
}


// ─── CAMBIO DE POKÉMON ─────────────────────────────────────────

function mostrarPanelCambio() {
  dom.accionesBatalla.classList.add('oculto');
  dom.cambioPokemon.classList.remove('oculto');

  dom.cambioSlots.innerHTML = '';
  batalla.pokemonEquipo.forEach((mon, i) => {
    if (i === batalla.indiceJugador || !mon) return;
    const cfg = mon._config || {};
    const stats = calcularStatsCompletos(mon, cfg, cfg.nivel || 100);
    const slot = document.createElement('div');
    slot.className = 'cambio-slot';
    slot.innerHTML = `
      <img src="${urlSpriteBatalla(mon.name, 'gen5')}" alt="${mon.name}"
           onerror="this.src='${urlSpriteBatalla(mon.name, 'dex')}'" />
      <div>
        <strong>${cfg.apodo || mon.name}</strong>
        <span>HP: ${stats.hp}</span>
      </div>
    `;
    slot.addEventListener('click', () => realizarCambio(i));
    dom.cambioSlots.appendChild(slot);
  });

  if (!dom.cambioSlots.children.length) {
    dom.cambioSlots.innerHTML = '<p style="color:#aaa;padding:8px">No hay más Pokémon disponibles.</p>';
  }
}

function ocultarPanelCambio() {
  dom.cambioPokemon.classList.add('oculto');
  dom.accionesBatalla.classList.remove('oculto');
}

async function realizarCambio(nuevoIndice) {
  ocultarPanelCambio();
  ocultarAcciones();

  const monNuevo = batalla.pokemonEquipo[nuevoIndice];
  const cfgN = monNuevo._config || {};
  batalla.indiceJugador = nuevoIndice;

  batalla.jugador.pokemon    = monNuevo;
  batalla.jugador.nombre     = cfgN.apodo || monNuevo.name;
  batalla.jugador.nivel      = cfgN.nivel || 100;
  batalla.jugador.stats      = calcularStatsCompletos(monNuevo, cfgN, batalla.jugador.nivel);
  batalla.jugador.hpMax      = batalla.jugador.stats.hp;
  batalla.jugador.hpActual   = batalla.jugador.hpMax;
  batalla.jugador.tipos      = monNuevo.types.map(t => t.type.name);
  batalla.jugador.movimientos = (cfgN.movimientos || []).filter(Boolean).slice(0, 4);
  if (!batalla.jugador.movimientos.length)
    batalla.jugador.movimientos = monNuevo.moves.slice(0, 4).map(m => m.move.name);
  batalla.jugador.estado        = null;
  batalla.jugador.dormidoTurnos = 0;
  batalla.jugador.modificadores = { atk:0, def:0, spa:0, spd:0, spe:0 };

  dom.spriteJugador.src = urlSpriteBatallaEspalda(monNuevo.name);
  dom.spriteJugador.onerror = function () {
    this.src = urlSpriteBatalla(monNuevo.name, 'dex');
  };
  dom.nombreJugador.textContent = batalla.jugador.nombre;
  dom.nivelJugador.textContent  = `Nv.${batalla.jugador.nivel}`;
  actualizarBarrasHP();
  renderizarMovimientos();
  actualizarBadgeEstado('jugador');

  await mostrarTexto(`¡${batalla.jugador.nombre} entró al campo de batalla!`, 1000);

  // El enemigo ataca después del cambio
  await turnoEnemigo();
  if (batalla.enemigo.hpActual <= 0) { await finBatalla('victoria'); return; }
  if (batalla.jugador.hpActual <= 0) { await finBatalla('derrota'); return; }

  batalla.turno++;
  mostrarAcciones();
}


// ─── HUIR ──────────────────────────────────────────────────────

async function huirDeBatalla() {
  ocultarAcciones();
  await mostrarTexto('¡Huiste de la batalla!', 1000);
  await finBatalla('huida');
}


// ─── FIN DE BATALLA ────────────────────────────────────────────

async function finBatalla(resultado) {
  batalla.activa = false;
  ocultarAcciones();

  if (resultado === 'victoria') {
    await mostrarTexto(`¡${batalla.enemigo.nombre} se debilitó! ¡Ganaste!`, 1400);
    animarVictoria();
    dom.resultadoTitulo.textContent = '¡Victoria!';
    dom.resultadoSub.textContent    = `¡Derrotaste a ${batalla.enemigo.nombre}!`;
  } else if (resultado === 'derrota') {
    await mostrarTexto(`¡${batalla.jugador.nombre} se debilitó! ¡Perdiste!`, 1400);
    dom.resultadoTitulo.textContent = 'Derrota';
    dom.resultadoSub.textContent    = `${batalla.jugador.nombre} no pudo aguantar.`;
  } else {
    dom.resultadoTitulo.textContent = 'Huir';
    dom.resultadoSub.textContent    = 'Escapaste.';
  }

  dom.resultadoSprites.innerHTML = `
    <img src="${urlSpriteBatalla(batalla.jugador.pokemon.name, 'gen5')}" alt="${batalla.jugador.nombre}"
         onerror="this.src='${urlSpriteBatalla(batalla.jugador.pokemon.name, 'dex')}'" />
    <span style="font-size:2rem">⚔️</span>
    <img src="${urlSpriteBatalla(batalla.enemigo.nombre, 'gen5')}" alt="${batalla.enemigo.nombre}"
         onerror="this.src='${urlSpriteBatalla(batalla.enemigo.nombre, 'dex')}'" />
  `;

  await esperar(800);
  cambiarPantalla('resultado');
}

function reiniciarBatalla() {
  cambiarPantalla('inicio');
  renderizarSlotsSeleccion();
  dom.btnIniciar.disabled  = false;
  dom.btnIniciar.textContent = '¡Comenzar Batalla!';
}


// ─── HELPERS UI ────────────────────────────────────────────────

function cambiarPantalla(id) {
  ['inicio','arena','resultado'].forEach(p => {
    document.getElementById(`batalla-${p}`)?.classList.remove('activa');
  });
  document.getElementById(`batalla-${id}`)?.classList.add('activa');
}

function mostrarAcciones() {
  dom.logBatalla.classList.add('oculto');
  dom.accionesBatalla.classList.remove('oculto');
  dom.cambioPokemon.classList.add('oculto');
}

function ocultarAcciones() {
  dom.accionesBatalla.classList.add('oculto');
  dom.cambioPokemon.classList.add('oculto');
  dom.logBatalla.classList.remove('oculto');
}

function mostrarTexto(texto, duracion = 1000) {
  dom.logBatalla.classList.remove('oculto');
  dom.accionesBatalla.classList.add('oculto');

  return new Promise(resolve => {
    dom.textoBatalla.textContent = texto;
    // Animación de tipo máquina de escribir ligera
    dom.textoBatalla.classList.remove('texto-aparece');
    void dom.textoBatalla.offsetWidth; // reflow
    dom.textoBatalla.classList.add('texto-aparece');
    setTimeout(resolve, duracion);
  });
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function animarAtaque(ladoDefensor) {
  const el = ladoDefensor === 'enemigo'
    ? document.getElementById('sprite-enemigo-cont')
    : document.getElementById('sprite-jugador-cont');
  el?.classList.add('golpeado');
  setTimeout(() => el?.classList.remove('golpeado'), 500);
}

function animarFallo(lado) {
  const el = lado === 'jugador'
    ? document.getElementById('sprite-jugador-cont')
    : document.getElementById('sprite-enemigo-cont');
  el?.classList.add('fallo');
  setTimeout(() => el?.classList.remove('fallo'), 600);
}

function animarVictoria() {
  document.getElementById('sprite-jugador-cont')?.classList.add('victoria');
}

function actualizarBadgeEstado(lado) {
  const badge = lado === 'jugador' ? dom.estadoJugBadge : dom.estadoEnemBadge;
  const estado = lado === 'jugador' ? batalla.jugador.estado : batalla.enemigo.estado;
  if (!estado) {
    badge.classList.add('oculto');
    badge.textContent = '';
    return;
  }
  const etiquetas = {
    paralizado: 'PAR', envenenado: 'VEN', quemado: 'QUE',
    dormido: 'DOR', congelado: 'CON'
  };
  badge.textContent = etiquetas[estado] || estado.slice(0,3).toUpperCase();
  badge.className = `info-estado-badge estado-${estado}`;
}

// ─── INICIALIZACIÓN ────────────────────────────────────────────

(function inicializarBatalla() {
  // Esperar a que el DOM esté listo
  const intentar = () => {
    const pagina = document.getElementById('pagina-batalla-prueba');
    if (!pagina) { setTimeout(intentar, 100); return; }
    cachearDOM();
    construirUIBatalla();

    // Escuchar cuando el usuario navega a esta sección
    document.addEventListener('click', e => {
      const btn = e.target.closest('.boton-nav');
      if (btn?.dataset.pagina === 'batalla-prueba') {
        setTimeout(renderizarSlotsSeleccion, 50);
      }
    });

    // Si ya está activa al cargar
    setTimeout(renderizarSlotsSeleccion, 200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', intentar);
  } else {
    intentar();
  }
})();
