// shots.js — deterministic screenshot staging for Warung Cepat. One job:
// turn URL params ?shot=cover|rush|assembly|serve&seed=N into real game
// states using the real renderer and a seeded RNG. Nothing is faked.

import { RECIPES, TUNING, SHIFT_SECONDS, RUSH_SECONDS } from './config.js';
import { makeRng, rngInt } from './random.js';

function makeOrder(id, recipeId, patience, doneSteps) {
  const recipe = RECIPES[recipeId];
  return {
    id,
    recipeId,
    name: recipe.name,
    color: recipe.color,
    steps: recipe.steps.map((s, i) => ({ ing: s.ing, state: s.state, label: s.label || null, done: i < doneSteps })),
    patience,
    patienceMax: TUNING.patienceSeconds,
    age: 0,
    state: 'open',
  };
}

function stageCommon(game, rng) {
  game.state = 'playing';
  game.shot = true;
  game.orders.spawnTimer = 9999; // freeze spawning: the scene is staged, not simulated
  game.orders.list = [];
  game.world.board = null;
  game.world.plate = null;
  game.world.readyPlate = null;
  for (const b of game.world.burners) {
    b.item = null;
    b.progress = 0;
    b.cooked = false;
    b.burnt = false;
    b.burnTime = 0;
  }
  game.chef.hands = null;
  game.chef.moveTarget = null;
  game.chef.pendingStation = null;
  game.message = '';
  game.messageTimer = 0;
  return rng;
}

// cover: busy kitchen, 3 tickets, ingredients on the counter, chef
// mid-assembly, timer visible, a plate ready to serve at the window.
function stageCover(game, rng) {
  stageCommon(game, rng);
  game.time = 135;
  game.score = 120;
  game.coins = 120;
  game.combo = 3;
  game.orders.list = [
    makeOrder(1, 'nasi-goreng', 32, 2),
    makeOrder(2, 'mie-goreng', 40, 0),
    makeOrder(3, 'es-teh', 25, 0),
  ];
  // Chef at the assembly counter, holding the next step (kecap) for the
  // Nasi Goreng on the plate. Stands below the station label row so no
  // label text is ever drawn over the chef.
  game.world.plate = {
    orderId: 1,
    recipeId: 'nasi-goreng',
    items: [
      { ing: 'beras', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
    ],
  };
  game.chef.x = 700;
  game.chef.y = 410;
  game.chef.dir = 'up';
  game.chef.hands = { ing: 'kecap', state: 'raw' };
  // A finished Es Teh Manis waits at the serving window.
  game.world.readyPlate = {
    orderId: 3,
    recipeId: 'es-teh',
    items: [
      { ing: 'teh', state: 'raw' },
      { ing: 'es', state: 'raw' },
      { ing: 'gula', state: 'raw' },
    ],
  };
  // Ingredients in progress elsewhere: sayur on the board, mie in the wok.
  game.world.board = { item: { ing: 'sayur', state: 'raw' }, progress: 0.55 };
  game.world.burners[0].item = { ing: 'mie', state: 'raw' };
  game.world.burners[0].progress = 0.6;
}

// rush: 4 tickets with low patience, last-seconds timer, rush banner.
function stageRush(game, rng) {
  stageCommon(game, rng);
  game.time = 24;
  game.rush = true;
  game.score = 380;
  game.coins = 380;
  game.combo = 5;
  game.orders.list = [
    makeOrder(1, 'nasi-goreng', rngInt(rng, 6, 9), 3),
    makeOrder(2, 'mie-goreng', rngInt(rng, 8, 12), 1),
    makeOrder(3, 'sate-ayam', rngInt(rng, 5, 8), 0),
    makeOrder(4, 'gado-gado', rngInt(rng, 9, 12), 2),
  ];
  game.world.plate = {
    orderId: 1,
    recipeId: 'nasi-goreng',
    items: [
      { ing: 'beras', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
      { ing: 'kecap', state: 'raw' },
    ],
  };
  game.chef.x = 950;
  game.chef.y = 415;
  game.chef.dir = 'up';
  game.chef.hands = { dish: true, recipeId: 'sate-ayam' };
  game.world.burners[0].item = { ing: 'telur', state: 'raw' };
  game.world.burners[0].progress = 0.8;
  game.world.burners[1].item = { ing: 'ayam', state: 'cooked' };
  game.world.burners[1].cooked = true;
  game.world.burners[1].progress = 1;
}

// assembly: a dish mid-assembly on the plate, ingredients laid out.
function stageAssembly(game, rng) {
  stageCommon(game, rng);
  game.time = 120;
  game.score = 90;
  game.coins = 90;
  game.combo = 2;
  game.orders.list = [
    makeOrder(1, 'gado-gado', 30, 2),
    makeOrder(2, 'nasi-goreng', 42, 0),
  ];
  game.world.plate = {
    orderId: 1,
    recipeId: 'gado-gado',
    items: [
      { ing: 'sayur', state: 'chopped' },
      { ing: 'telur', state: 'cooked' },
    ],
  };
  game.chef.x = 700;
  game.chef.y = 410;
  game.chef.dir = 'up';
  game.chef.hands = { ing: 'kecap', state: 'raw' };
  game.world.board = { item: { ing: 'ayam', state: 'raw' }, progress: 0.35 };
  game.world.burners[0].item = { ing: 'beras', state: 'raw' };
  game.world.burners[0].progress = 0.45;
}

// serve: a finished plate at the serving window with a coins popup.
function stageServe(game, rng) {
  stageCommon(game, rng);
  game.time = 96;
  game.score = 240;
  game.coins = 240;
  game.combo = 4;
  game.orders.list = [
    makeOrder(1, 'mie-goreng', 28, 0),
    makeOrder(2, 'es-teh', 18, 0),
  ];
  game.world.readyPlate = {
    orderId: 1,
    recipeId: 'mie-goreng',
    items: [
      { ing: 'mie', state: 'cooked' },
      { ing: 'telur', state: 'cooked' },
      { ing: 'sayur', state: 'chopped' },
      { ing: 'kecap', state: 'raw' },
    ],
  };
  game.chef.x = 1060;
  game.chef.y = 420;
  game.chef.dir = 'up';
  game.chef.hands = null;
  const serve = game.world.stations.find((s) => s.kind === 'serve');
  game.world.floats.push({
    x: serve.x + serve.w / 2,
    y: serve.y - 6,
    text: '+60 koin',
    color: '#f5b301',
    age: 0.3,
    life: 1.2,
  });
  for (let i = 0; i < 10; i++) {
    game.world.particles.push({
      x: serve.x + serve.w / 2 + (rng() - 0.5) * 80,
      y: serve.y + 40 + (rng() - 0.5) * 30,
      vx: (rng() - 0.5) * 60,
      vy: -30 - rng() * 40,
      life: 1.0,
      age: 0.2,
      color: '#f5b301',
      size: 3 + rng() * 2,
    });
  }
}

const STAGES = { cover: stageCover, rush: stageRush, assembly: stageAssembly, serve: stageServe };

export function applyShot(game, name, seed) {
  const stage = STAGES[name];
  if (!stage) return false;
  const rng = makeRng(seed || 1);
  stage(game, rng);
  return true;
}

export function shotFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return null;
    return { name: shot, seed: parseInt(params.get('seed') || '1', 10) || 1 };
  } catch (e) {
    return null;
  }
}
