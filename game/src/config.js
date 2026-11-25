// config.js — Warung Cepat: recipes, tuning, palette and station layout.
// One job: every number and name the rest of the game reads.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 180;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 4;
export const RUSH_SECONDS = 30;

export const PALETTE = {
  wall: '#1d6f6a',
  wallTile: '#27837d',
  wallDark: '#155550',
  floor: '#c99a63',
  floorDark: '#b3854f',
  counterTop: '#a9713a',
  counterWood: '#7c4a22',
  counterEdge: '#5d3413',
  cream: '#fff3d6',
  paper: '#fff8e7',
  ink: '#2b1d12',
  muted: '#7a6a58',
  red: '#e4572e',
  green: '#43a047',
  gold: '#f5b301',
  teal: '#2a9d8f',
  chili: '#d62828',
  steam: 'rgba(255,255,255,0.55)',
};

export const INGREDIENTS = {
  beras: { name: 'Beras', color: '#f5f0e1', dark: '#cbbf9a', chop: false, cook: true, shape: 'grain' },
  mie: { name: 'Mie', color: '#f2c14e', dark: '#c98f1b', chop: false, cook: true, shape: 'noodle' },
  telur: { name: 'Telur', color: '#fdf6e3', dark: '#d8c49a', chop: false, cook: true, shape: 'egg' },
  ayam: { name: 'Ayam', color: '#f2a65a', dark: '#c47a2e', chop: true, cook: true, shape: 'drumstick' },
  sayur: { name: 'Sayur', color: '#66bb6a', dark: '#2e7d32', chop: true, cook: false, shape: 'leaf' },
  cabai: { name: 'Cabai', color: '#e53935', dark: '#8e1414', chop: false, cook: false, shape: 'chili' },
  kecap: { name: 'Kecap', color: '#4e342e', dark: '#2d1a12', chop: false, cook: false, shape: 'bottle' },
  teh: { name: 'Teh', color: '#8d6e63', dark: '#5d4037', chop: false, cook: false, shape: 'cup' },
  es: { name: 'Es', color: '#b3e5fc', dark: '#4fc3f7', chop: false, cook: false, shape: 'cube' },
  gula: { name: 'Gula', color: '#ffffff', dark: '#cfc4b0', chop: false, cook: false, shape: 'sugar' },
};

// A recipe step: the ingredient id and the state it must be in when plated.
// States: 'raw' | 'chopped' | 'cooked'. `label` overrides the ticket text.
export const RECIPES = {
  'nasi-goreng': {
    name: 'Nasi Goreng',
    baseCoins: 30,
    color: '#e8a33d',
    steps: [
      { ing: 'beras', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
      { ing: 'kecap', state: 'raw' },
      { ing: 'cabai', state: 'raw' },
    ],
  },
  'mie-goreng': {
    name: 'Mie Goreng',
    baseCoins: 30,
    color: '#d9822b',
    steps: [
      { ing: 'mie', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
      { ing: 'sayur', state: 'chopped' },
      { ing: 'kecap', state: 'raw' },
    ],
  },
  'sate-ayam': {
    name: 'Sate Ayam',
    baseCoins: 25,
    color: '#c96a3b',
    steps: [
      { ing: 'ayam', state: 'cooked' },
      { ing: 'kecap', state: 'raw', label: 'Bumbu Kecap' },
    ],
  },
  'es-teh': {
    name: 'Es Teh Manis',
    baseCoins: 15,
    color: '#a1887f',
    steps: [
      { ing: 'teh', state: 'raw' },
      { ing: 'es', state: 'raw' },
      { ing: 'gula', state: 'raw' },
    ],
  },
  'gado-gado': {
    name: 'Gado-Gado',
    baseCoins: 25,
    color: '#7cb342',
    steps: [
      { ing: 'sayur', state: 'chopped' },
      { ing: 'telur', state: 'cooked' },
      { ing: 'kecap', state: 'raw', label: 'Saus Kacang' },
    ],
  },
};

export const RECIPE_IDS = Object.keys(RECIPES);

export const TUNING = {
  chefSpeed: 270,
  interactRange: 115,
  chopSeconds: 1.6,
  cookSeconds: 3.0,
  burnSeconds: 3.0,
  spawnStartSeconds: 13,
  spawnEndSeconds: 5.5,
  patienceSeconds: 48,
  comboStep: 0.25,
  comboMax: 3,
  rushCoinMultiplier: 2,
  starCoins: [120, 260, 420],
};

// Station layout. Kitchen floor starts right of the order board.
export const STATIONS = [
  // Ingredient crates along the top wall, one per ingredient.
  ...Object.keys(INGREDIENTS).map((id, i) => ({
    kind: 'crate',
    id: `crate-${id}`,
    ingredient: id,
    x: 256 + i * 102,
    y: 100,
    w: 96,
    h: 66,
  })),
  { kind: 'board', id: 'board', x: 256, y: 216, w: 190, h: 108 },
  { kind: 'burner', id: 'burner-1', x: 452, y: 216, w: 128, h: 108 },
  { kind: 'burner', id: 'burner-2', x: 590, y: 216, w: 128, h: 108 },
  { kind: 'plate', id: 'plate', x: 728, y: 216, w: 230, h: 108 },
  { kind: 'serve', id: 'serve', x: 964, y: 216, w: 300, h: 108 },
  { kind: 'trash', id: 'trash', x: 1140, y: 570, w: 96, h: 84 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function stationLabel(station) {
  if (station.kind === 'crate') return INGREDIENTS[station.ingredient].name;
  if (station.kind === 'board') return 'Talenan';
  if (station.kind === 'burner') return 'Wajan';
  if (station.kind === 'plate') return 'Piring Saji';
  if (station.kind === 'serve') return 'Jendela Saji';
  if (station.kind === 'trash') return 'Tong Sampah';
  return station.id;
}
