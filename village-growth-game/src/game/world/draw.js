// 캔버스 픽셀아트 렌더링 (모든 그래픽을 코드로 그려 통일된 스타일 유지)
//  각 타일을 8x8 가상 그리드로 보고 블록을 찍어 32x32 픽셀아트 느낌을 낸다.

import { T, OBJ } from './worldgen';

// 타일 내 블록 채우기 (u = size/8)
function blk(ctx, color, gx, gy, gw, gh, ox, oy, u) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(ox + gx * u), Math.round(oy + gy * u), Math.ceil(gw * u), Math.ceil(gh * u));
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

const CROP_COLOR = {
  wheat: '#e3c45a', potato: '#c79b6a', corn: '#f4d03f', strawberry: '#e8556b', grape: '#9b59b6',
};

// 지형 타일
export function drawTile(ctx, code, tx, ty, px, py, size, pal, time) {
  const u = size / 8;
  if (code === T.WATER) { drawWater(ctx, px, py, size, pal, time); return; }

  let base = pal.grass;
  if (code === T.GRASS2) base = pal.grass2;
  else if (code === T.PATH) base = '#bd9a6a';
  else if (code === T.SAND) base = pal.sand;
  else if (code === T.SOIL) base = pal.soil;
  else if (code === T.FLOWERBED) base = pal.grass;
  ctx.fillStyle = base;
  ctx.fillRect(px, py, size + 1, size + 1);

  const seed = (tx * 7 + ty * 13) % 8;
  if (code === T.GRASS || code === T.GRASS2) {
    blk(ctx, shade(base, 18), (seed) % 7, (seed * 3) % 7, 1, 1, px, py, u);
    blk(ctx, shade(base, -14), (seed * 2) % 7, (seed + 2) % 7, 1, 1, px, py, u);
  } else if (code === T.PATH) {
    blk(ctx, shade(base, -22), seed % 7, (seed * 2) % 7, 1, 1, px, py, u);
    blk(ctx, shade(base, 14), (seed + 3) % 7, (seed + 1) % 7, 1, 1, px, py, u);
  } else if (code === T.SOIL) {
    blk(ctx, shade(base, -20), 0, 2, 8, 0.6, px, py, u);
    blk(ctx, shade(base, -20), 0, 5, 8, 0.6, px, py, u);
  } else if (code === T.FLOWERBED) {
    blk(ctx, pal.flower, 2, 2, 1.4, 1.4, px, py, u);
    blk(ctx, '#fff', 5, 4, 1.2, 1.2, px, py, u);
    blk(ctx, pal.flower, 4, 1, 1.2, 1.2, px, py, u);
  }
}

function drawWater(ctx, px, py, size, pal, time) {
  ctx.fillStyle = pal.water;
  ctx.fillRect(px, py, size + 1, size + 1);
  const u = size / 8;
  const w = Math.sin(time / 600 + px * 0.05) > 0 ? 1 : 0;
  blk(ctx, shade(pal.water, 26), 1 + w, 2, 2, 0.6, px, py, u);
  blk(ctx, shade(pal.water, 26), 4 - w, 5, 2, 0.6, px, py, u);
  blk(ctx, shade(pal.water, -20), 5, 1, 1.5, 0.6, px, py, u);
}

// 자연물
export function drawObject(ctx, type, px, py, size, pal) {
  const u = size / 8;
  if (type === OBJ.TREE) {
    blk(ctx, '#6b4a2b', 3.4, 5, 1.2, 3, px, py, u); // 줄기
    blk(ctx, shade(pal.tree, -10), 1.5, 1, 5, 4.5, px, py, u);
    blk(ctx, pal.leaf, 2, 0.4, 4, 3.6, px, py, u);
    blk(ctx, shade(pal.leaf, 20), 2.6, 1, 1.4, 1.2, px, py, u);
  } else if (type === OBJ.ROCK) {
    blk(ctx, '#8b8f96', 1.6, 3.6, 4.8, 3, px, py, u);
    blk(ctx, '#a8adb4', 2.2, 3, 3, 1.6, px, py, u);
    blk(ctx, '#6e7279', 2.5, 5.5, 3.5, 1, px, py, u);
  } else if (type === OBJ.BUSH) {
    blk(ctx, shade(pal.tree, 6), 1.6, 3, 4.8, 3.2, px, py, u);
    blk(ctx, pal.leaf, 2.4, 2.6, 3.2, 2.4, px, py, u);
  } else if (type === OBJ.FLOWER) {
    blk(ctx, '#3e8e41', 3.6, 4.5, 0.8, 2.5, px, py, u);
    blk(ctx, pal.flower, 2.8, 2.6, 2.4, 2.4, px, py, u);
    blk(ctx, '#fff35a', 3.6, 3.4, 0.9, 0.9, px, py, u);
  }
}

// 밭 작물 (성장도 0~1, ready 시 열매색)
export function drawCrop(ctx, cropId, ratio, ready, px, py, size) {
  const u = size / 8;
  const h = 1 + ratio * 4.5;
  blk(ctx, '#4f8a3a', 3.4, 7 - h, 1.2, h, px, py, u);
  if (ready) {
    const c = CROP_COLOR[cropId] || '#e3c45a';
    blk(ctx, c, 2.6, 7 - h - 0.4, 2.8, 2, px, py, u);
    blk(ctx, shade(c, 30), 3.2, 7 - h, 1, 1, px, py, u);
  } else if (ratio > 0.4) {
    blk(ctx, '#6fb05a', 2.6, 7 - h, 2.8, 1.4, px, py, u);
  }
}

// 진입 건물 (지붕+벽+문+창문, 밤엔 창문 발광)
export function drawBuilding(ctx, b, px, py, size, night) {
  const w = b.w * size, h = b.h * size;
  const u = size / 8;
  // 벽
  ctx.fillStyle = '#caa46a';
  ctx.fillRect(px, py + h * 0.32, w, h * 0.68);
  ctx.fillStyle = '#b8915a';
  ctx.fillRect(px, py + h * 0.32, w, 3);
  // 지붕
  ctx.fillStyle = '#a4493e';
  ctx.beginPath();
  ctx.moveTo(px - 3, py + h * 0.36);
  ctx.lineTo(px + w / 2, py - 2);
  ctx.lineTo(px + w + 3, py + h * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7e362d';
  ctx.fillRect(px - 3, py + h * 0.34, w + 6, 4);
  // 문
  ctx.fillStyle = '#6b4a2b';
  const dw = size * 0.5, dh = h * 0.4;
  ctx.fillRect(px + w / 2 - dw / 2, py + h - dh, dw, dh);
  // 창문 (밤엔 노란 발광)
  ctx.fillStyle = night ? '#ffe27a' : '#7fb8d6';
  blk(ctx, ctx.fillStyle, 1.2, 4.4, 1.6, 1.6, px, py, u);
  blk(ctx, ctx.fillStyle, (b.w * 8) - 2.8, 4.4, 1.6, 1.6, px, py, u);
  if (night) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffe27a';
    ctx.fillRect(px, py + h * 0.3, w, h * 0.7);
    ctx.restore();
  }
}

// 배치형 장식물
export function drawPlaceable(ctx, type, px, py, size, night) {
  const u = size / 8;
  if (type === 'house') {
    ctx.fillStyle = '#cdb084'; ctx.fillRect(px + 2, py + size * 0.4, size - 4, size * 0.6);
    ctx.fillStyle = '#9a5a4a';
    ctx.beginPath(); ctx.moveTo(px, py + size * 0.45); ctx.lineTo(px + size / 2, py + 2); ctx.lineTo(px + size, py + size * 0.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = night ? '#ffe27a' : '#6b4a2b';
    blk(ctx, ctx.fillStyle, 3.2, 5, 1.6, 2.4, px, py, u);
  } else if (type === 'well') {
    ctx.fillStyle = '#8b8f96'; ctx.fillRect(px + size * 0.25, py + size * 0.4, size * 0.5, size * 0.5);
    ctx.fillStyle = '#3f9fe0'; blk(ctx, '#3f9fe0', 3, 4, 2, 1.4, px, py, u);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(px + size * 0.2, py + size * 0.2, size * 0.6, 3);
  } else if (type === 'lamp') {
    ctx.fillStyle = '#555'; ctx.fillRect(px + size / 2 - 2, py + size * 0.3, 4, size * 0.6);
    ctx.fillStyle = night ? '#ffd24a' : '#cdb24a';
    ctx.beginPath(); ctx.arc(px + size / 2, py + size * 0.3, size * 0.16, 0, 7); ctx.fill();
  } else if (type === 'fence') {
    ctx.fillStyle = '#8a6a44';
    blk(ctx, '#8a6a44', 1, 2, 6, 1, px, py, u);
    blk(ctx, '#8a6a44', 1.6, 1, 1, 5, px, py, u);
    blk(ctx, '#8a6a44', 5.4, 1, 1, 5, px, py, u);
  } else if (type === 'flowerpot') {
    ctx.fillStyle = '#b5651d'; blk(ctx, '#b5651d', 2.6, 5, 2.8, 2, px, py, u);
    ctx.fillStyle = '#ff6fae'; blk(ctx, '#ff6fae', 3, 3, 2, 2, px, py, u);
  }
}

// 가로등 야간 빛 (별도 레이어로 덧칠)
export function drawLampGlow(ctx, px, py, size) {
  const g = ctx.createRadialGradient(px + size / 2, py + size * 0.3, 2, px + size / 2, py + size * 0.3, size * 2.2);
  g.addColorStop(0, 'rgba(255,220,120,0.5)');
  g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(px - size * 2, py - size * 2, size * 5, size * 5);
}

// 플레이어
export function drawPlayer(ctx, px, py, size, facing, frame) {
  const u = size / 8;
  const bob = frame ? 0 : 0.4;
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(px + size / 2, py + size - 3, size * 0.28, size * 0.12, 0, 0, 7); ctx.fill();
  // 몸
  blk(ctx, '#3f6fb0', 2.6, 4 + bob, 2.8, 2.6, px, py, u);
  // 머리
  blk(ctx, '#f0c9a0', 2.8, 1.6 + bob, 2.4, 2.2, px, py, u);
  // 모자
  blk(ctx, '#c0492f', 2.5, 1 + bob, 3, 1, px, py, u);
  // 방향 표시 (눈)
  ctx.fillStyle = '#2b2b2b';
  let ex = 3.4;
  if (facing === 'left') ex = 2.9;
  else if (facing === 'right') ex = 3.9;
  if (facing !== 'up') blk(ctx, '#2b2b2b', ex, 2.4 + bob, 0.7, 0.7, px, py, u);
}

// NPC
export function drawNPC(ctx, px, py, size, color) {
  const u = size / 8;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(px + size / 2, py + size - 3, size * 0.26, size * 0.11, 0, 0, 7); ctx.fill();
  blk(ctx, color, 2.7, 4, 2.6, 2.6, px, py, u);
  blk(ctx, '#f0c9a0', 2.9, 1.8, 2.2, 2.1, px, py, u);
  blk(ctx, '#3a2e25', 2.7, 1.3, 2.6, 0.9, px, py, u);
}
