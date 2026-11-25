// world.js — the kitchen itself for Warung Cepat. One job: hold the stations,
// what sits on them, the chef's carried item, particles and floating text.

import { STATIONS, TUNING } from './config.js';

export function createWorld() {
  const world = {
    stations: STATIONS.map((s) => ({ ...s, item: null, progress: 0, cookTime: 0, burnt: false })),
    board: null, // { item, progress } — the chopping board slot
    burners: [
      { id: 'burner-1', item: null, progress: 0, cooked: false, burnTime: 0 },
      { id: 'burner-2', item: null, progress: 0, cooked: false, burnTime: 0 },
    ],
    plate: null, // { orderId, recipeId, items: [{ing, state}] }
    readyPlate: null, // finished plate waiting at the serving window (shot staging)
    particles: [],
    floats: [],
    shake: 0,
    shakeX: 0,
    shakeY: 0,
  };
  return world;
}

export function worldStation(world, id) {
  return world.stations.find((s) => s.id === id);
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function nearestStation(world, x, y, range) {
  let best = null;
  let bestD = range;
  for (const s of world.stations) {
    const c = stationCenter(s);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function addParticles(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = (speed || 90) * (0.4 + Math.random() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 40,
      life: 0.5 + Math.random() * 0.4,
      age: 0,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

export function addSteam(world, x, y) {
  world.particles.push({
    x: x + (Math.random() - 0.5) * 30,
    y,
    vx: (Math.random() - 0.5) * 12,
    vy: -34 - Math.random() * 18,
    life: 0.9,
    age: 0,
    color: 'steam',
    size: 5 + Math.random() * 5,
  });
}

export function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color: color || '#f5b301', age: 0, life: 1.2 });
}

export function updateWorldFx(world, dt) {
  for (const p of world.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.life);
  for (const f of world.floats) {
    f.age += dt;
    f.y -= 42 * dt;
  }
  world.floats = world.floats.filter((f) => f.age < f.life);
  if (world.shake > 0) {
    world.shake = Math.max(0, world.shake - dt * 2.2);
    world.shakeX = (Math.random() - 0.5) * 10 * world.shake;
    world.shakeY = (Math.random() - 0.5) * 10 * world.shake;
  } else {
    world.shakeX = 0;
    world.shakeY = 0;
  }
}

// The wok needs a cookable item: raw beras/mie/telur, or chopped ayam.
export function wokAccepts(item) {
  if (!item || item.state === 'cooked' || item.state === 'burnt') return false;
  if (item.ing === 'ayam') return item.state === 'chopped';
  return item.state === 'raw' && (item.ing === 'beras' || item.ing === 'mie' || item.ing === 'telur');
}

// A raw item that can be chopped: sayur or ayam.
export function boardAccepts(item) {
  if (!item || item.state !== 'raw') return false;
  return item.ing === 'sayur' || item.ing === 'ayam';
}

export function cookedStateOf(item) {
  return { ing: item.ing, state: 'cooked' };
}

export function choppedStateOf(item) {
  return { ing: item.ing, state: 'chopped' };
}

export function isBurnt(item) {
  return item && item.state === 'burnt';
}
