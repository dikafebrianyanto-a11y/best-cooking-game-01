// chef.js — the chef for Warung Cepat. One job: move the chef, run the
// interact key and mouse clicks, and advance chopping and wok cooking.

import { TUNING, INGREDIENTS, RECIPES, stationLabel } from './config.js';
import { moveVector } from './input.js';
import { nearestStation, stationCenter, addParticles, addSteam, addFloat, boardAccepts, wokAccepts } from './world.js';
import { orderNextStep, orderIsComplete, dishCoins, serveOrder } from './orders.js';

export function createChef() {
  return {
    x: 640,
    y: 480,
    dir: 'down',
    hands: null, // {ing, state} | {dish:true, recipeId}
    moveTarget: null,
    pendingStation: null,
    walkPhase: 0,
    chopSoundTimer: 0,
  };
}

export function chefHandsLabel(chef) {
  if (!chef.hands) return '';
  if (chef.hands.dish) return RECIPES[chef.hands.recipeId].name;
  const ing = INGREDIENTS[chef.hands.ing];
  const state = chef.hands.state === 'raw' ? '' : chef.hands.state === 'chopped' ? ' (cincang)' : ' (matang)';
  return ing.name + state;
}

function clampChef(chef) {
  chef.x = Math.max(272, Math.min(1256, chef.x));
  chef.y = Math.max(152, Math.min(692, chef.y));
}

export function updateChef(game, dt) {
  const { chef, input, world } = game;
  const vec = moveVector(input);
  let moving = false;

  if (vec.x !== 0 || vec.y !== 0) {
    chef.moveTarget = null;
    chef.pendingStation = null;
    chef.x += vec.x * TUNING.chefSpeed * dt;
    chef.y += vec.y * TUNING.chefSpeed * dt;
    if (Math.abs(vec.x) > Math.abs(vec.y)) chef.dir = vec.x > 0 ? 'right' : 'left';
    else chef.dir = vec.y > 0 ? 'down' : 'up';
    moving = true;
  } else if (chef.moveTarget) {
    const dx = chef.moveTarget.x - chef.x;
    const dy = chef.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      chef.moveTarget = null;
      if (chef.pendingStation) {
        const station = chef.pendingStation;
        chef.pendingStation = null;
        tryInteractAt(game, station);
      }
    } else {
      chef.x += (dx / d) * TUNING.chefSpeed * dt;
      chef.y += (dy / d) * TUNING.chefSpeed * dt;
      if (Math.abs(dx) > Math.abs(dy)) chef.dir = dx > 0 ? 'right' : 'left';
      else chef.dir = dy > 0 ? 'down' : 'up';
      moving = true;
    }
  }

  if (moving) chef.walkPhase += dt * 10;
  clampChef(chef);

  // Hold E (or Space) at the chopping board to chop.
  const chopping = (input.isDown('KeyE') || input.isDown('Space')) && world.board;
  if (chopping) {
    const board = world.board;
    board.progress += dt / TUNING.chopSeconds;
    chef.chopSoundTimer -= dt;
    if (chef.chopSoundTimer <= 0) {
      chef.chopSoundTimer = 0.32;
      game.audio.chop();
      const c = stationCenter(worldStationByKind(world, 'board'));
      addParticles(world, c.x, c.y + 10, INGREDIENTS[board.item.ing].color, 4, 70);
    }
    if (board.progress >= 1) {
      const item = { ing: board.item.ing, state: 'chopped' };
      world.board = null;
      chef.hands = item;
      game.audio.ding();
    }
  }

  updateKitchen(game, dt);
}

function worldStationByKind(world, kind) {
  return world.stations.find((s) => s.kind === kind);
}

// Burners cook on their own once an item is in; a finished dish burns if
// it sits too long. Steam and sizzle run while anything cooks.
export function updateKitchen(game, dt) {
  const { world, audio } = game;
  let anyCooking = false;
  for (const burner of world.burners) {
    if (!burner.item) continue;
    if (!burner.cooked && !burner.burnt) {
      anyCooking = true;
      burner.progress += dt / TUNING.cookSeconds;
      if (Math.random() < dt * 6) {
        const st = world.stations.find((s) => s.id === burner.id);
        addSteam(world, st.x + st.w / 2, st.y + 20);
      }
      if (burner.progress >= 1) {
        burner.cooked = true;
        burner.burnTime = 0;
        burner.item = { ing: burner.item.ing, state: 'cooked' };
        audio.ding();
      }
    } else if (burner.cooked && !burner.burnt) {
      burner.burnTime += dt;
      if (Math.random() < dt * 4) {
        const st = world.stations.find((s) => s.id === burner.id);
        addSteam(world, st.x + st.w / 2, st.y + 20);
      }
      if (burner.burnTime >= TUNING.burnSeconds) {
        burner.burnt = true;
        burner.item = { ing: burner.item.ing, state: 'burnt' };
        audio.error();
      }
    }
  }
  if (anyCooking) audio.startSizzle();
  else audio.stopSizzle();
}

export function tryInteract(game) {
  const station = nearestStation(game.world, game.chef.x, game.chef.y, TUNING.interactRange);
  if (station) tryInteractAt(game, station);
}

export function tryInteractAt(game, station) {
  const { chef, world, orders, audio } = game;
  if (!station) return;

  if (station.kind === 'crate') {
    if (!chef.hands) {
      chef.hands = { ing: station.ingredient, state: 'raw' };
      audio.pickup();
    }
    return;
  }

  if (station.kind === 'board') {
    if (!world.board && chef.hands && boardAccepts(chef.hands)) {
      world.board = { item: chef.hands, progress: 0 };
      chef.hands = null;
      audio.place();
    } else if (world.board && !chef.hands) {
      chef.hands = world.board.item;
      world.board = null;
      audio.pickup();
    }
    return;
  }

  if (station.kind === 'burner') {
    const burner = world.burners.find((b) => b.id === station.id);
    if (!burner) return;
    if (!burner.item && chef.hands && wokAccepts(chef.hands)) {
      burner.item = chef.hands;
      burner.progress = 0;
      burner.cooked = false;
      burner.burnt = false;
      burner.burnTime = 0;
      chef.hands = null;
      audio.place();
    } else if (burner.item && (burner.cooked || burner.burnt) && !chef.hands) {
      chef.hands = burner.item;
      burner.item = null;
      burner.progress = 0;
      burner.cooked = false;
      burner.burnt = false;
      audio.pickup();
    }
    return;
  }

  if (station.kind === 'plate') {
    if (chef.hands && !chef.hands.dish) {
      placeOnPlate(game, chef.hands);
    } else if (!chef.hands && world.plate && orderIsComplete(plateOrder(game))) {
      chef.hands = { dish: true, recipeId: world.plate.recipeId };
      world.plate = null;
      audio.pickup();
    }
    return;
  }

  if (station.kind === 'serve') {
    if (chef.hands && chef.hands.dish) serveDish(game);
    else if (chef.hands) wrongServe(game, 'Bukan hidangan jadi!');
    return;
  }

  if (station.kind === 'trash') {
    if (chef.hands) {
      chef.hands = null;
      audio.place();
    }
    return;
  }
}

function plateOrder(game) {
  if (!game.world.plate) return null;
  return game.orders.list.find((o) => o.id === game.world.plate.orderId) || null;
}

function placeOnPlate(game, item) {
  const { chef, world, orders, audio } = game;
  const matchStep = (order) => {
    const next = orderNextStep(order);
    return next && next.ing === item.ing && next.state === item.state ? next : null;
  };

  if (!world.plate) {
    // Start a new plate for the oldest open order this item fits.
    const order = orders.list.find((o) => o.state === 'open' && matchStep(o));
    if (!order) {
      audio.error();
      world.shake = 0.6;
      return;
    }
    world.plate = { orderId: order.id, recipeId: order.recipeId, items: [{ ing: item.ing, state: item.state }] };
    matchStep(order).done = true;
    chef.hands = null;
    audio.place();
    return;
  }

  const order = plateOrder(game);
  if (!order || order.state !== 'open') {
    // The ticket expired under the plate: clear it.
    world.plate = null;
    audio.error();
    world.shake = 0.6;
    return;
  }
  const next = matchStep(order);
  if (!next) {
    audio.error();
    world.shake = 0.6;
    return;
  }
  world.plate.items.push({ ing: item.ing, state: item.state });
  next.done = true;
  chef.hands = null;
  audio.place();
  if (orderIsComplete(order)) audio.ding();
}

function serveDish(game) {
  const { chef, world, orders, audio } = game;
  const recipeId = chef.hands.recipeId;
  const order = serveOrder(orders, recipeId);
  const serve = world.stations.find((s) => s.kind === 'serve');
  const cx = serve.x + serve.w / 2;
  const cy = serve.y + serve.h / 2;
  chef.hands = null;
  if (order) {
    game.combo++;
    const coins = dishCoins(recipeId, game.combo, game.rush);
    game.coins += coins;
    game.score += coins;
    game.dishesServed++;
    addFloat(world, cx, cy - 30, `+${coins} koin`, '#f5b301');
    addParticles(world, cx, cy, '#f5b301', 14, 130);
    audio.coin();
    audio.ding();
  } else {
    wrongServe(game, 'Tidak ada yang pesan ini!');
  }
}

function wrongServe(game, message) {
  const { world, audio } = game;
  game.strikes++;
  game.combo = 0;
  world.shake = 1;
  game.message = message;
  game.messageTimer = 1.6;
  audio.error();
}
