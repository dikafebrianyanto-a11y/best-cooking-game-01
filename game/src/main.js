// main.js — game loop and state machine for Warung Cepat. One job: wire
// input, chef, orders, world and rendering together, and run the shift.

import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, MAX_STRIKES, RUSH_SECONDS } from './config.js';
import { makeRng } from './random.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld, updateWorldFx } from './world.js';
import { createOrders, updateOrders, starsForCoins } from './orders.js';
import { createChef, updateChef, tryInteract } from './chef.js';
import { render } from './render.js';
import { applyShot, shotFromUrl } from './shots.js';

export function createGame(canvas) {
  const game = {
    canvas,
    ctx: canvas.getContext('2d'),
    state: 'title', // title | playing | paused | results
    shot: false,
    time: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    combo: 0,
    strikes: 0,
    dishesServed: 0,
    stars: 0,
    rush: false,
    message: '',
    messageTimer: 0,
    startButton: null,
    rng: makeRng((Date.now() % 2147483647) || 1),
    audio: createAudio(),
    input: createInput(canvas),
    world: createWorld(),
    chef: createChef(),
    orders: null,
  };
  game.orders = createOrders(game.rng);
  return game;
}

export function resetShift(game) {
  game.time = SHIFT_SECONDS;
  game.elapsed = 0;
  game.score = 0;
  game.coins = 0;
  game.combo = 0;
  game.strikes = 0;
  game.dishesServed = 0;
  game.stars = 0;
  game.rush = false;
  game.message = '';
  game.messageTimer = 0;
  game.world = createWorld();
  game.chef = createChef();
  game.orders = createOrders(game.rng);
  game.state = 'playing';
}

function endShift(game) {
  game.state = 'results';
  game.stars = starsForCoins(game.coins);
  game.audio.stopSizzle();
  game.audio.stopMusic();
}

function startShift(game) {
  game.audio.ensure();
  game.audio.startMusic();
  resetShift(game);
}

function pointInRect(x, y, rect) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function stationAtPoint(game, x, y) {
  for (const s of game.world.stations) {
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) return s;
  }
  return null;
}

function handleClick(game) {
  const { input, chef } = game;
  if (game.state === 'title' || game.state === 'results') {
    if (pointInRect(input.clickedX, input.clickedY, game.startButton)) {
      game.audio.ensure();
      startShift(game);
    }
    return;
  }
  if (game.state !== 'playing') return;
  const station = stationAtPoint(game, input.clickedX, input.clickedY);
  if (station) {
    const cx = station.x + station.w / 2;
    const cy = station.y + station.h / 2 + 60;
    chef.moveTarget = { x: Math.max(272, Math.min(1256, cx)), y: Math.max(152, Math.min(692, cy)) };
    chef.pendingStation = station;
  } else if (input.clickedX > 248) {
    chef.moveTarget = {
      x: Math.max(272, Math.min(1256, input.clickedX)),
      y: Math.max(152, Math.min(692, input.clickedY)),
    };
    chef.pendingStation = null;
  }
}

export function updateGame(game, dt) {
  const { input } = game;

  if (input.wasPressed('KeyM')) {
    game.audio.ensure();
    game.audio.toggleMute();
  }

  if (game.state === 'title') {
    if (input.wasPressed('Enter') || input.wasPressed('NumpadEnter')) startShift(game);
    if (input.clicked) handleClick(game);
    return;
  }

  if (game.state === 'results') {
    if (input.wasPressed('Enter') || input.wasPressed('NumpadEnter')) startShift(game);
    if (input.clicked) handleClick(game);
    return;
  }

  if (game.state === 'paused') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) game.state = 'playing';
    return;
  }

  // Playing.
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    game.state = 'paused';
    game.audio.stopSizzle();
    return;
  }
  if (input.clicked) handleClick(game);
  if (input.wasPressed('KeyE') || input.wasPressed('Space')) tryInteract(game);

  if (game.shot) return; // staged scene: frozen, rendered as-is.

  game.elapsed += dt;
  game.time -= dt;
  game.rush = game.time <= RUSH_SECONDS && game.time > 0;
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.messageTimer <= 0) game.message = '';

  updateOrders(game.orders, dt, game.elapsed, game.rush, (order) => {
    // An expired ticket is a strike; a plate built for it is wasted.
    game.strikes++;
    game.combo = 0;
    game.world.shake = 0.8;
    game.message = `Pesanan ${order.name} hangus!`;
    game.messageTimer = 1.6;
    game.audio.error();
    if (game.world.plate && game.world.plate.orderId === order.id) game.world.plate = null;
  });

  updateChef(game, dt);
  updateWorldFx(game.world, dt);

  if (game.time <= 0) {
    game.time = 0;
    endShift(game);
    return;
  }
  if (game.strikes >= MAX_STRIKES) {
    endShift(game);
  }
}

export function startGame(game) {
  game.input.attach();
  const shot = shotFromUrl();
  if (shot) {
    resetShift(game);
    applyShot(game, shot.name, shot.seed);
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    updateGame(game, dt);
    render(game.ctx, game);
    game.input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}

// Auto-start when loaded in a browser.
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const game = createGame(canvas);
    startGame(game);
    window.__warungGame = game;
  }
}
