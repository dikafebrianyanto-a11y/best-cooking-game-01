// render.js — all canvas drawing for Warung Cepat. One job: turn the game
// state into a warm, readable warung kitchen (no images, all drawn in code).

import { CANVAS_W, CANVAS_H, PALETTE, INGREDIENTS, RECIPES, TUNING, MAX_STRIKES, stationLabel } from './config.js';
import { nearestStation, stationCenter } from './world.js';
import { chefHandsLabel } from './chef.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---------------------------------------------------------------- food icons

export function drawIngredientIcon(ctx, ing, state, x, y, r) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.1, r * 0.2);
    ctx.moveTo(r * 0.4, -r * 0.3);
    ctx.lineTo(-r * 0.1, r * 0.3);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const chopped = state === 'chopped';
  const cooked = state === 'cooked';
  ctx.fillStyle = cooked ? shade(def.color, -18) : def.color;
  ctx.strokeStyle = def.dark;
  ctx.lineWidth = 2;
  switch (def.shape) {
    case 'grain': {
      ctx.beginPath();
      ctx.ellipse(0, r * 0.25, r, r * 0.62, 0, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fffdf5';
      for (let i = 0; i < 7; i++) {
        const a = -0.9 + i * 0.3;
        ctx.beginPath();
        ctx.arc(Math.sin(a * 2.1) * r * 0.55, -r * 0.15 + Math.abs(Math.cos(a)) * r * 0.3, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'noodle': {
      ctx.lineWidth = 3;
      ctx.strokeStyle = cooked ? '#d89a2b' : '#e8b93c';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        for (let t = 0; t <= 8; t++) {
          const px = -r * 0.8 + (t / 8) * r * 1.6;
          const py = i * r * 0.45 + Math.sin(t * 1.4) * r * 0.22;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }
    case 'egg': {
      if (cooked) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fffdf5';
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = '#f5a623';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.72, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fdf6e3';
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'drumstick': {
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, r * 0.1, r * 0.75, r * 0.6, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = cooked ? '#b5651d' : '#f2a65a';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.55, -r * 0.55, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#fdf6e3';
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'leaf': {
      ctx.fillStyle = chopped ? '#558b2f' : '#66bb6a';
      for (let i = 0; i < 3; i++) {
        const a = -0.5 + i * 0.5;
        ctx.beginPath();
        ctx.ellipse(Math.sin(a) * r * 0.5, Math.cos(a) * r * 0.3, r * 0.5, r * 0.28, a, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (chopped) {
        ctx.strokeStyle = '#2e7d32';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.5);
        ctx.lineTo(r * 0.5, -r * 0.5);
        ctx.stroke();
      }
      break;
    }
    case 'chili': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, r * 0.2);
      ctx.quadraticCurveTo(0, -r, r * 0.8, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.4, r * 0.1, -r * 0.2, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.7, r * 0.6, -r * 0.8, r * 0.2);
      ctx.fillStyle = '#e53935';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.55);
      ctx.quadraticCurveTo(r * 1.05, -r * 0.8, r * 0.95, -r * 0.35);
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
    case 'bottle': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.9);
      ctx.lineTo(r * 0.35, -r * 0.9);
      ctx.lineTo(r * 0.45, -r * 0.3);
      ctx.lineTo(r * 0.55, r * 0.85);
      ctx.lineTo(-r * 0.55, r * 0.85);
      ctx.lineTo(-r * 0.45, -r * 0.3);
      ctx.closePath();
      ctx.fillStyle = '#4e342e';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d7ccc8';
      ctx.fillRect(-r * 0.35, -r * 0.1, r * 0.7, r * 0.45);
      break;
    }
    case 'cup': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.4);
      ctx.lineTo(r * 0.6, -r * 0.4);
      ctx.lineTo(r * 0.45, r * 0.8);
      ctx.lineTo(-r * 0.45, r * 0.8);
      ctx.closePath();
      ctx.fillStyle = '#efebe9';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-r * 0.5, -r * 0.4, r, r * 0.25);
      ctx.beginPath();
      ctx.arc(r * 0.7, r * 0.1, r * 0.3, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      break;
    }
    case 'cube': {
      ctx.fillStyle = 'rgba(179,229,252,0.9)';
      ctx.strokeStyle = '#4fc3f7';
      ctx.save();
      ctx.rotate(0.3);
      ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      ctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.4);
      ctx.lineTo(r * 0.2, -r * 0.4);
      ctx.lineTo(-r * 0.4, r * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'sugar': {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cfc4b0';
      for (const [ox, oy] of [[-0.35, -0.2], [0.3, -0.35], [0, 0.35]]) {
        ctx.save();
        ctx.translate(ox * r, oy * r);
        ctx.rotate(0.2);
        ctx.fillRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
        ctx.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
        ctx.restore();
      }
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------- kitchen

function drawKitchen(ctx, game) {
  const { world } = game;
  // Wall with teal tiles.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(248, 56, CANVAS_W - 248, 144);
  ctx.fillStyle = PALETTE.wallTile;
  for (let x = 248; x < CANVAS_W; x += 64) {
    for (let y = 56; y < 200; y += 32) {
      if (((x - 248) / 64 + (y - 56) / 32) % 2 === 0) ctx.fillRect(x + 2, y + 2, 60, 28);
    }
  }
  // Warm lamp glow over the counters.
  const glow = ctx.createRadialGradient(760, 150, 20, 760, 150, 420);
  glow.addColorStop(0, 'rgba(255,214,130,0.20)');
  glow.addColorStop(1, 'rgba(255,214,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(248, 56, CANVAS_W - 248, 300);
  // Wood floor planks, staggered shades so the floor is not one flat colour.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(248, 200, CANVAS_W - 248, CANVAS_H - 200);
  for (let row = 0, y = 200; y < CANVAS_H; y += 48, row++) {
    for (let x = 248; x < CANVAS_W; x += 130) {
      if (((x - 248) / 130 + row) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, 130, 48);
      }
    }
  }
  ctx.fillStyle = PALETTE.floorDark;
  for (let y = 224; y < CANVAS_H; y += 48) ctx.fillRect(248, y, CANVAS_W - 248, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let x = 300; x < CANVAS_W; x += 130) ctx.fillRect(x, 200, 2, CANVAS_H - 200);

  // Stations.
  for (const s of world.stations) drawStation(ctx, game, s);

  // Floor decor: rug, rice sacks, side table, plants.
  drawFloorDecor(ctx);

  // Chopping board slot.
  if (world.board) {
    const b = world.stations.find((s) => s.kind === 'board');
    drawIngredientIcon(ctx, world.board.item.ing, world.board.item.state, b.x + b.w / 2, b.y + 42, 20);
    drawProgressRing(ctx, b.x + b.w / 2, b.y + 42, 30, world.board.progress, '#43a047');
  }
  // Plate on the assembly counter.
  if (world.plate) {
    const p = world.stations.find((s) => s.kind === 'plate');
    drawPlate(ctx, world.plate, p.x + p.w / 2, p.y + 52);
  }
  // Ready plate staged at the serving window.
  if (world.readyPlate) {
    const s = world.stations.find((st) => st.kind === 'serve');
    drawPlate(ctx, world.readyPlate, s.x + s.w / 2, s.y + 55);
  }
}

function drawSack(ctx, x, y) {
  ctx.fillStyle = '#e8dcc3';
  rr(ctx, x, y, 64, 56, 14);
  ctx.fill();
  ctx.strokeStyle = '#c9b48a';
  ctx.lineWidth = 2;
  rr(ctx, x, y, 64, 56, 14);
  ctx.stroke();
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(x + 8, y + 8, 48, 4);
  text(ctx, 'BERAS', x + 32, y + 36, 'bold 11px sans-serif', '#b5651d', 'center');
}

function drawPlant(ctx, x, y) {
  ctx.fillStyle = '#43a047';
  for (const [ox, oy, rx, ry, rot] of [[-14, -18, 12, 20, -0.4], [0, -28, 12, 22, 0], [14, -18, 12, 20, 0.4]]) {
    ctx.save();
    ctx.translate(x + ox, y + oy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#b5651d';
  rr(ctx, x - 22, y, 44, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#8d4e15';
  ctx.fillRect(x - 24, y - 4, 48, 10);
}

function drawFloorDecor(ctx) {
  // Woven rug in the open floor.
  ctx.fillStyle = '#8d3b34';
  rr(ctx, 480, 450, 480, 130, 10);
  ctx.fill();
  ctx.fillStyle = '#b5654a';
  rr(ctx, 492, 462, 456, 106, 8);
  ctx.fill();
  ctx.fillStyle = '#8d3b34';
  rr(ctx, 504, 474, 432, 82, 6);
  ctx.fill();
  ctx.fillStyle = '#e8c99a';
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(576 + i * 84, 515);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();
  }
  // Sacks of rice, bottom-left.
  drawSack(ctx, 288, 486);
  drawSack(ctx, 352, 500);
  // Side table with finished plates, right of the rug.
  ctx.fillStyle = '#7c4a22';
  ctx.fillRect(990, 500, 130, 14);
  ctx.fillStyle = '#5d3413';
  ctx.fillRect(998, 514, 10, 56);
  ctx.fillRect(1102, 514, 10, 56);
  for (const [px, py] of [[1024, 496], [1088, 496]]) {
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.ellipse(px, py, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.arc(px - 6, py - 2, 4, 0, Math.PI * 2);
    ctx.arc(px + 6, py - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Potted plants.
  drawPlant(ctx, 320, 612);
  drawPlant(ctx, 1220, 428);
}

function drawPlate(ctx, plate, x, y) {
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.ellipse(x, y, 52, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bdbdbd';
  ctx.lineWidth = 2;
  ctx.stroke();
  const recipe = RECIPES[plate.recipeId];
  plate.items.forEach((item, i) => {
    const ix = x - 34 + i * (plate.items.length > 1 ? 68 / (plate.items.length - 1) : 0);
    drawIngredientIcon(ctx, item.ing, item.state, ix, y - 6, 13);
  });
  if (recipe) text(ctx, recipe.name, x, y + 34, 'bold 13px sans-serif', PALETTE.ink, 'center');
}

function drawProgressRing(ctx, x, y, r, progress, color) {
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
}

function drawStation(ctx, game, s) {
  const { world } = game;
  const near = nearestStation(world, game.chef.x, game.chef.y, TUNING.interactRange) === s;
  ctx.save();
  if (near) {
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 16;
  }
  if (s.kind === 'crate') {
    ctx.fillStyle = PALETTE.counterWood;
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, 10);
    const def = INGREDIENTS[s.ingredient];
    drawIngredientIcon(ctx, s.ingredient, 'raw', s.x + s.w / 2, s.y + 34, 15);
  } else if (s.kind === 'board') {
    ctx.fillStyle = PALETTE.counterWood;
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#e8c99a';
    rr(ctx, s.x + 18, s.y + 14, s.w - 36, s.h - 44, 8);
    ctx.fill();
  } else if (s.kind === 'burner') {
    const burner = world.burners.find((b) => b.id === s.id);
    ctx.fillStyle = '#37474f';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    // Flame under the wok while cooking.
    if (burner && burner.item && !burner.cooked) {
      ctx.fillStyle = '#ff7043';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 62, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffca28';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 60, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 42, 44, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 38, 44, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    if (burner && burner.item) {
      drawIngredientIcon(ctx, burner.item.ing, burner.item.state, s.x + s.w / 2, s.y + 38, 15);
      if (!burner.cooked) drawProgressRing(ctx, s.x + s.w / 2, s.y + 38, 26, burner.progress, '#ff7043');
      else if (burner.burnt) text(ctx, 'GOSONG!', s.x + s.w / 2, s.y + 12, 'bold 12px sans-serif', '#ff5252', 'center');
      else text(ctx, 'MATANG', s.x + s.w / 2, s.y + 12, 'bold 12px sans-serif', '#69f0ae', 'center');
    }
  } else if (s.kind === 'plate') {
    ctx.fillStyle = PALETTE.counterWood;
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 32, 6);
    ctx.fill();
    if (!world.plate) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 44, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (s.kind === 'serve') {
    ctx.fillStyle = '#5d4037';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    rr(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 44, 6);
    ctx.fill();
    // Service bell.
    ctx.fillStyle = '#f5b301';
    ctx.beginPath();
    ctx.arc(s.x + 34, s.y + 34, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(s.x + 18, s.y + 34, 32, 4);
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#546e7a';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#37474f';
    rr(ctx, s.x + 6, s.y + 4, s.w - 12, 12, 6);
    ctx.fill();
  }
  ctx.restore();
  // One short name on a pill BELOW the box — never inside it, never
  // overlapping a neighbour. Station interiors stay free for contents.
  const label = s.kind === 'crate' ? INGREDIENTS[s.ingredient].name
    : s.kind === 'board' ? 'Talenan'
    : s.kind === 'burner' ? 'Wajan'
    : s.kind === 'plate' ? 'Piring Saji'
    : s.kind === 'serve' ? 'Jendela Saji'
    : 'Sampah';
  labelBelow(ctx, s, label);
}

// Short station name on a dark pill centred below the station box.
function labelBelow(ctx, s, str) {
  const cx = s.x + s.w / 2;
  const y = s.y + s.h + 14;
  ctx.font = 'bold 12px sans-serif';
  const w = ctx.measureText(str).width;
  ctx.fillStyle = 'rgba(43,29,18,0.6)';
  rr(ctx, cx - w / 2 - 9, y - 10, w + 18, 20, 10);
  ctx.fill();
  text(ctx, str, cx, y, 'bold 12px sans-serif', '#fff', 'center');
}

// ---------------------------------------------------------------- chef

function drawChef(ctx, game) {
  const { chef } = game;
  const bob = Math.sin(chef.walkPhase) * 2;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  ctx.scale(1.15, 1.15);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: teal shirt, white apron.
  ctx.fillStyle = '#00897b';
  rr(ctx, -16, -6, 32, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  rr(ctx, -11, 0, 22, 28, 7);
  ctx.fill();
  ctx.fillStyle = '#e4572e';
  ctx.fillRect(-11, 12, 22, 3);
  // Head.
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(0, -20, 13, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -32, 8, 0, Math.PI * 2);
  ctx.arc(0, -36, 9, 0, Math.PI * 2);
  ctx.arc(8, -32, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -34, 26, 7);
  // Face.
  ctx.fillStyle = '#2b1d12';
  const look = chef.dir === 'left' ? -3 : chef.dir === 'right' ? 3 : 0;
  ctx.beginPath();
  ctx.arc(-4 + look, -20, 1.8, 0, Math.PI * 2);
  ctx.arc(4 + look, -20, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(look, -15, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item above the head.
  if (chef.hands) {
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.beginPath();
    ctx.arc(0, -58, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (chef.hands.dish) {
      drawIngredientIcon(ctx, RECIPES[chef.hands.recipeId].steps[0].ing, 'cooked', 0, -58, 12);
    } else {
      drawIngredientIcon(ctx, chef.hands.ing, chef.hands.state, 0, -58, 12);
    }
    text(ctx, chefHandsLabel(chef), 0, -82, 'bold 12px sans-serif', '#fff', 'center');
  }
  ctx.restore();
}

// ---------------------------------------------------------------- orders

function drawOrderBoard(ctx, game) {
  const { orders } = game;
  ctx.fillStyle = '#3e2723';
  rr(ctx, 8, 64, 232, 648, 12);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  rr(ctx, 8, 64, 232, 44, 12);
  ctx.fill();
  ctx.fillRect(8, 96, 232, 12);
  text(ctx, 'PESANAN', 124, 86, 'bold 20px sans-serif', '#ffe0b2', 'center');
  if (orders.list.length === 0) {
    text(ctx, 'Belum ada pesanan.', 124, 160, '14px sans-serif', '#bcaaa4', 'center');
    text(ctx, 'Pesanan baru segera datang!', 124, 184, '13px sans-serif', '#bcaaa4', 'center');
  }
  orders.list.forEach((order, i) => {
    const y = 118 + i * 148;
    const low = order.patience < 10;
    const flash = low && Math.floor(game.time * 3) % 2 === 0;
    ctx.fillStyle = flash ? '#ffebee' : PALETTE.paper;
    rr(ctx, 18, y, 212, 138, 10);
    ctx.fill();
    ctx.fillStyle = order.color;
    rr(ctx, 18, y, 212, 30, 10);
    ctx.fill();
    ctx.fillRect(18, y + 20, 212, 10);
    text(ctx, order.name, 28, y + 15, 'bold 15px sans-serif', '#fff', 'left');
    text(ctx, `${Math.ceil(order.patience)} dtk`, 220, y + 15, 'bold 13px sans-serif', '#fff', 'right');
    // Patience bar.
    const pw = 192 * Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#e0e0e0';
    rr(ctx, 28, y + 38, 192, 8, 4);
    ctx.fill();
    ctx.fillStyle = low ? '#e53935' : '#43a047';
    if (pw > 0) {
      rr(ctx, 28, y + 38, pw, 8, 4);
      ctx.fill();
    }
    // Steps with icons and check marks.
    order.steps.forEach((step, si) => {
      const sy = y + 62 + si * 22;
      drawIngredientIcon(ctx, step.ing, step.state, 40, sy, 9);
      const label = step.label || `${INGREDIENTS[step.ing].name}${step.state === 'cooked' ? ' matang' : step.state === 'chopped' ? ' cincang' : ''}`;
      text(ctx, label, 56, sy, '13px sans-serif', step.done ? '#9e9e9e' : PALETTE.ink, 'left');
      if (step.done) {
        ctx.strokeStyle = '#43a047';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(196, sy - 4);
        ctx.lineTo(202, sy + 3);
        ctx.lineTo(214, sy - 7);
        ctx.stroke();
      }
    });
  });
  text(ctx, `Pesanan selesai: ${orders.served}`, 124, 700, 'bold 13px sans-serif', '#ffe0b2', 'center');
}

// ---------------------------------------------------------------- HUD

function drawHUD(ctx, game) {
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, CANVAS_W, 56);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, 52, CANVAS_W, 4);
  text(ctx, 'WARUNG CEPAT', 16, 28, 'bold 22px sans-serif', '#ffe0b2', 'left');
  // Timer.
  const remaining = Math.max(0, game.time);
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const lowTime = remaining <= 10 && game.state === 'playing';
  const pulse = lowTime ? 1 + 0.08 * Math.sin(game.time * 10) : 1;
  ctx.save();
  ctx.translate(560, 28);
  ctx.scale(pulse, pulse);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 0, 0, 'bold 30px sans-serif', lowTime ? '#ff5252' : '#ffffff', 'center');
  ctx.restore();
  text(ctx, 'SISA WAKTU', 560, 12, '10px sans-serif', '#bcaaa4', 'center');
  // Score, coins, combo.
  text(ctx, `Skor ${game.score}`, 700, 28, 'bold 18px sans-serif', '#ffffff', 'left');
  text(ctx, `Koin ${game.coins}`, 830, 28, 'bold 18px sans-serif', '#f5b301', 'left');
  if (game.combo >= 2) {
    text(ctx, `Kombo x${(1 + TUNING.comboStep * (game.combo - 1)).toFixed(2)}`, 960, 28, 'bold 18px sans-serif', '#69f0ae', 'left');
  }
  // Strikes as chili marks.
  for (let i = 0; i < MAX_STRIKES; i++) {
    const x = 1150 + i * 36;
    ctx.globalAlpha = i < game.strikes ? 1 : 0.25;
    drawIngredientIcon(ctx, 'cabai', 'raw', x, 28, 13);
    ctx.globalAlpha = 1;
  }
  // Rush banner: a pill under the HUD bar, over wall tiles only — the
  // crates row now starts below it, so it never covers a crate name.
  if (game.rush && game.state === 'playing') {
    const blink = Math.floor(game.time * 4) % 2 === 0;
    ctx.fillStyle = blink ? '#e4572e' : '#c62828';
    rr(ctx, 480, 60, 320, 34, 17);
    ctx.fill();
    text(ctx, 'JAM SIBUK! Koin x2', 640, 77, 'bold 18px sans-serif', '#fff', 'center');
  }
  // Hint bar.
  text(ctx, 'WASD / Panah: gerak   •   E / Spasi: ambil & letakkan (tahan E untuk cincang)   •   Klik: jalan ke stasiun   •   P: jeda   •   M: suara', 640, 706, '12px sans-serif', 'rgba(255,255,255,0.75)', 'center');
  // Toast message: slim pill in the clear band between the crate labels
  // and the stations row, so it never covers a crate or a station.
  if (game.message && game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(62,39,35,0.92)';
    rr(ctx, 440, 190, 400, 26, 13);
    ctx.fill();
    text(ctx, game.message, 640, 203, 'bold 14px sans-serif', '#ffccbc', 'center');
  }
  // Interaction hint: ONE pill in a dedicated hint bar at the very
  // bottom — never drawn over the chef, a station, or a station label.
  if (game.state === 'playing') {
    const station = nearestStation(game.world, game.chef.x, game.chef.y, TUNING.interactRange);
    if (station) {
      const label = stationLabel(station);
      const action = station.kind === 'crate' ? `Ambil ${label}` : station.kind === 'board' ? 'Cincang (tahan E)' : station.kind === 'burner' ? 'Masak / Ambil' : station.kind === 'plate' ? 'Susun di piring' : station.kind === 'serve' ? 'Sajikan!' : 'Buang';
      const prompt = `[E] ${action}`;
      ctx.font = 'bold 14px sans-serif';
      const w = ctx.measureText(prompt).width;
      ctx.fillStyle = 'rgba(43,29,18,0.88)';
      rr(ctx, 640 - w / 2 - 14, 650, w + 28, 30, 15);
      ctx.fill();
      ctx.strokeStyle = '#f5b301';
      ctx.lineWidth = 2;
      rr(ctx, 640 - w / 2 - 14, 650, w + 28, 30, 15);
      ctx.stroke();
      text(ctx, prompt, 640, 665, 'bold 14px sans-serif', '#ffe0b2', 'center');
    }
  }
}

// ---------------------------------------------------------------- particles

function drawFx(ctx, game) {
  const { world } = game;
  for (const p of world.particles) {
    const a = 1 - p.age / p.life;
    if (p.color === 'steam') {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`;
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.color === 'steam' ? (1 + p.age) : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const f of world.floats) {
    const a = 1 - f.age / f.life;
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y, 'bold 22px sans-serif', f.color, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- screens

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = PALETTE.paper;
  rr(ctx, 290, 90, 700, 540, 18);
  ctx.fill();
  ctx.strokeStyle = '#e4572e';
  ctx.lineWidth = 4;
  rr(ctx, 290, 90, 700, 540, 18);
  ctx.stroke();
  text(ctx, 'WARUNG CEPAT', 640, 160, 'bold 64px sans-serif', '#e4572e', 'center');
  text(ctx, 'Warung kaki lima paling sibuk di kota — masak cepat, sajikan tepat!', 640, 205, '18px sans-serif', PALETTE.ink, 'center');
  const lines = [
    'Ambil bahan dari peti, cincang di talenan (tahan E), masak di wajan,',
    'susun di piring sesuai pesanan, lalu antar ke Jendela Saji.',
    'Hidangan salah atau pesanan kehabisan waktu = 1 teguran. 3 teguran, shift berakhir!',
    'Selesaikan pesanan beruntun untuk menaikkan kombo. Jam sibuk di 30 detik terakhir: koin x2!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 260 + i * 28, '16px sans-serif', '#5d4037', 'center'));
  text(ctx, 'Menu hari ini: Nasi Goreng • Mie Goreng • Sate Ayam • Es Teh Manis • Gado-Gado', 640, 400, 'bold 16px sans-serif', PALETTE.ink, 'center');
  text(ctx, 'WASD / Panah gerak  •  E / Spasi interaksi  •  Klik mouse ke stasiun  •  P jeda  •  M suara', 640, 440, '15px sans-serif', '#5d4037', 'center');
  // Start button.
  ctx.fillStyle = '#e4572e';
  rr(ctx, 520, 480, 240, 64, 32);
  ctx.fill();
  text(ctx, 'MULAI MASAK', 640, 512, 'bold 26px sans-serif', '#fff', 'center');
  text(ctx, 'Tekan Enter atau klik tombol', 640, 580, '14px sans-serif', '#8d6e63', 'center');
  game.startButton = { x: 520, y: 480, w: 240, h: 64 };
}

function drawStars(ctx, x, y, count, size) {
  for (let i = 0; i < 3; i++) {
    const cx = x + (i - 1) * size * 2.4;
    ctx.fillStyle = i < count ? '#f5b301' : '#e0e0e0';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? size : size * 0.45;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawResults(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,8,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = PALETTE.paper;
  rr(ctx, 340, 110, 600, 480, 18);
  ctx.fill();
  ctx.strokeStyle = '#e4572e';
  ctx.lineWidth = 4;
  rr(ctx, 340, 110, 600, 480, 18);
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 170, 'bold 44px sans-serif', '#e4572e', 'center');
  drawStars(ctx, 640, 235, game.stars, 26);
  text(ctx, `Skor akhir: ${game.score}`, 640, 300, 'bold 28px sans-serif', PALETTE.ink, 'center');
  text(ctx, `Koin dikumpulkan: ${game.coins}`, 640, 340, '20px sans-serif', '#5d4037', 'center');
  text(ctx, `Hidangan disajikan: ${game.dishesServed}`, 640, 372, '20px sans-serif', '#5d4037', 'center');
  text(ctx, `Pesanan hilang: ${game.orders.lost}`, 640, 404, '20px sans-serif', '#5d4037', 'center');
  text(ctx, `Teguran: ${game.strikes} / ${MAX_STRIKES}`, 640, 436, '20px sans-serif', '#5d4037', 'center');
  ctx.fillStyle = '#e4572e';
  rr(ctx, 520, 470, 240, 56, 28);
  ctx.fill();
  text(ctx, 'MAIN LAGI', 640, 498, 'bold 24px sans-serif', '#fff', 'center');
  text(ctx, 'Tekan Enter atau klik tombol', 640, 556, '14px sans-serif', '#8d6e63', 'center');
  game.startButton = { x: 520, y: 470, w: 240, h: 56 };
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,8,0.5)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'JEDA', 640, 330, 'bold 56px sans-serif', '#fff', 'center');
  text(ctx, 'Tekan P untuk lanjut masak', 640, 390, '20px sans-serif', '#ffe0b2', 'center');
}

// ---------------------------------------------------------------- root

export function render(ctx, game) {
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  if (game.world.shake > 0) ctx.translate(game.world.shakeX, game.world.shakeY);
  drawKitchen(ctx, game);
  drawChef(ctx, game);
  drawFx(ctx, game);
  ctx.restore();
  drawOrderBoard(ctx, game);
  drawHUD(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  else if (game.state === 'results') drawResults(ctx, game);
  else if (game.state === 'paused') drawPaused(ctx);
}
