// orders.js — order tickets for Warung Cepat. One job: spawn orders, tick
// their patience, score served dishes, and keep the combo and strikes.

import { RECIPES, RECIPE_IDS, TUNING, MAX_ORDERS, SHIFT_SECONDS } from './config.js';
import { rngPick, rngShuffle } from './random.js';

let nextOrderId = 1;

export function createOrders(rng) {
  return {
    rng,
    list: [],
    spawnTimer: 4,
    served: 0,
    lost: 0,
  };
}

export function spawnInterval(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return TUNING.spawnStartSeconds + (TUNING.spawnEndSeconds - TUNING.spawnStartSeconds) * t;
}

export function spawnOrder(orders, elapsed, rush) {
  if (orders.list.length >= MAX_ORDERS) return null;
  const recipeId = rngPick(orders.rng, RECIPE_IDS);
  const recipe = RECIPES[recipeId];
  const order = {
    id: nextOrderId++,
    recipeId,
    name: recipe.name,
    color: recipe.color,
    steps: recipe.steps.map((s) => ({ ing: s.ing, state: s.state, label: s.label || null, done: false })),
    patience: TUNING.patienceSeconds,
    patienceMax: TUNING.patienceSeconds,
    age: 0,
    state: 'open', // open | served | lost
  };
  orders.list.push(order);
  return order;
}

export function orderNextStep(order) {
  return order.steps.find((s) => !s.done) || null;
}

export function orderIsComplete(order) {
  return !!order && order.steps.every((s) => s.done);
}

export function updateOrders(orders, dt, elapsed, rush, onExpired) {
  orders.spawnTimer -= dt;
  if (orders.spawnTimer <= 0) {
    spawnOrder(orders, elapsed, rush);
    let interval = spawnInterval(elapsed);
    if (rush) interval *= 0.5;
    orders.spawnTimer = interval;
  }
  for (const order of orders.list) {
    if (order.state !== 'open') continue;
    order.patience -= dt;
    order.age += dt;
    if (order.patience <= 0) {
      order.state = 'lost';
      orders.lost++;
      if (onExpired) onExpired(order);
    }
  }
  orders.list = orders.list.filter((o) => o.state === 'open');
}

// Coins for serving a dish: base, combo multiplier, rush doubles.
export function dishCoins(recipeId, combo, rush) {
  const base = RECIPES[recipeId].baseCoins;
  const comboMult = 1 + TUNING.comboStep * Math.max(0, combo - 1);
  const mult = Math.min(TUNING.comboMax, comboMult) * (rush ? TUNING.rushCoinMultiplier : 1);
  return Math.round(base * mult);
}

export function serveOrder(orders, recipeId) {
  const order = orders.list.find((o) => o.state === 'open' && o.recipeId === recipeId);
  if (!order) return null;
  order.state = 'served';
  orders.served++;
  orders.list = orders.list.filter((o) => o.state === 'open');
  return order;
}

export function starsForCoins(coins) {
  const [one, two, three] = TUNING.starCoins;
  if (coins >= three) return 3;
  if (coins >= two) return 2;
  if (coins >= one) return 1;
  return 0;
}
