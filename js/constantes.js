/*
  ═══════════════════════════════════════════════════════════════
  Fuentes:
  • PokéAPI        https://pokeapi.co/api/v2/
  • Sprites gen5   https://play.pokemonshowdown.com/sprites/gen5/
  • Sprites dex    https://play.pokemonshowdown.com/sprites/dex/

  NOTA MENTA: Los nombres de tipos, naturalezas y estadísticas que
  vienen de la API permanecen en inglés (son claves internas).


  AYER FUE SÁBADO
  ═══════════════════════════════════════════════════════════════
*/

// CONSTANTES

const URL_POKEAPI      = 'https://pokeapi.co/api/v2';
const URL_SPRITE_GEN5  = 'https://play.pokemonshowdown.com/sprites/gen5/';
const URL_SPRITE_DEX   = 'https://play.pokemonshowdown.com/sprites/dex/';
const TAMANO_PAGINA    = 30;
const MAX_EQUIPO       = 6;

const TODOS_LOS_TIPOS = [
  'normal','fire','water','grass','electric','ice',
  'fighting','poison','ground','flying','psychic','bug',
  'rock','ghost','dragon','dark','steel','fairy'
];

const NATURALEZAS = {
  hardy:    { sube: null,  baja: null  },
  lonely:   { sube: 'atk', baja: 'def' },
  brave:    { sube: 'atk', baja: 'spe' },
  adamant:  { sube: 'atk', baja: 'spa' },
  naughty:  { sube: 'atk', baja: 'spd' },
  bold:     { sube: 'def', baja: 'atk' },
  docile:   { sube: null,  baja: null  },
  relaxed:  { sube: 'def', baja: 'spe' },
  impish:   { sube: 'def', baja: 'spa' },
  lax:      { sube: 'def', baja: 'spd' },
  timid:    { sube: 'spe', baja: 'atk' },
  hasty:    { sube: 'spe', baja: 'def' },
  serious:  { sube: null,  baja: null  },
  jolly:    { sube: 'spe', baja: 'spa' },
  naive:    { sube: 'spe', baja: 'spd' },
  modest:   { sube: 'spa', baja: 'atk' },
  mild:     { sube: 'spa', baja: 'def' },
  quiet:    { sube: 'spa', baja: 'spe' },
  bashful:  { sube: null,  baja: null  },
  rash:     { sube: 'spa', baja: 'spd' },
  calm:     { sube: 'spd', baja: 'atk' },
  gentle:   { sube: 'spd', baja: 'def' },
  sassy:    { sube: 'spd', baja: 'spe' },
  careful:  { sube: 'spd', baja: 'spa' },
  quirky:   { sube: null,  baja: null  },
};

const NOMBRES_ESTADISTICAS = {
  hp:  'HP',
  atk: 'Ataque',
  def: 'Defensa',
  spa: 'At. Esp.',
  spd: 'Def. Esp.',
  spe: 'Velocidad'
};

const CLAVES_ESTADISTICAS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];


