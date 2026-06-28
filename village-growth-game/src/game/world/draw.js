// 캔버스 픽셀아트 렌더링 (통일된 스타일)
//  - 모든 오브젝트 그림자, 12종 잔디 변형, 흙길 디테일
//  - 나무/꽃/풀 크기·모양 변형 + 바람 흔들림
//  - 입체적인 건물(지붕 명암·처마·굴뚝·창문)
//  지형(drawTile)은 오프스크린 캐시에 한 번만 그려 60FPS를 확보한다.

import { T, OBJ } from './worldgen';

function blk(ctx, color, gx, gy, gw, gh, ox, oy, u) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(ox + gx * u), Math.round(oy + gy * u), Math.max(1, Math.ceil(gw * u)), Math.max(1, Math.ceil(gh * u)));
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}
function shadow(ctx, cx, cy, rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 7);
  ctx.fill();
}
function h2(x, y) { const h = (x * 374761 + y * 668265) % 1000; return (h + 1000) % 1000; }

const CROP_COLOR = { wheat: '#e3c45a', potato: '#c79b6a', corn: '#f4d03f', strawberry: '#e8556b', grape: '#9b59b6' };

// ---- 지형(캐시에 그림) ----
export function drawTile(ctx, code, tx, ty, px, py, size, pal) {
  const u = size / 8;
  if (code === T.WATER) {
    ctx.fillStyle = pal.water; ctx.fillRect(px, py, size + 1, size + 1);
    blk(ctx, shade(pal.water, -16), 1, 5, 2, 0.6, px, py, u);
    blk(ctx, shade(pal.water, -16), 5, 2, 1.6, 0.6, px, py, u);
    return;
  }
  let base = pal.grass;
  if (code === T.GRASS2) base = pal.grass2;
  else if (code === T.PATH) base = pal.dirt;
  else if (code === T.SAND) base = pal.sand;
  else if (code === T.SOIL) base = pal.soil;
  ctx.fillStyle = base; ctx.fillRect(px, py, size + 1, size + 1);

  const v = h2(tx, ty) % 12;
  if (code === T.GRASS || code === T.GRASS2 || code === T.FLOWERBED) {
    const g3 = pal.grass3 || shade(base, 14);
    // 12종 잔디 변형: 색 얼룩 + 잔디날 위치 변화
    blk(ctx, shade(base, 12 + (v % 3) * 4), (v * 2) % 7, (v * 3) % 7, 1.2, 1.2, px, py, u);
    blk(ctx, shade(base, -12), (v + 4) % 7, (v + 1) % 7, 1, 1, px, py, u);
    // 잔디날 2~3개
    blk(ctx, g3, (v % 6) + 0.5, 5.5, 0.5, 1.4, px, py, u);
    blk(ctx, g3, (v * 3 % 6) + 1, 6, 0.5, 1.1, px, py, u);
    if (v % 4 === 0) blk(ctx, shade(g3, 16), (v % 5) + 2, 4.5, 0.5, 1.2, px, py, u);
    if (code === T.FLOWERBED) {
      blk(ctx, pal.flower, 2.4, 2.4, 1.3, 1.3, px, py, u);
      blk(ctx, '#fff35a', 3, 3, 0.7, 0.7, px, py, u);
      blk(ctx, pal.flower, 4.6, 4, 1.2, 1.2, px, py, u);
    }
  } else if (code === T.PATH) {
    // 흙길: 가장자리 음영 + 자갈 + 바퀴자국
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(px, py, size + 1, 2); ctx.fillRect(px, py, 2, size + 1);
    blk(ctx, shade(base, -18), (v % 6) + 1, (v % 5) + 1, 0.9, 0.7, px, py, u); // 자갈
    blk(ctx, shade(base, 12), (v * 2 % 6) + 1, (v * 3 % 5) + 2, 0.7, 0.6, px, py, u);
    if (v % 3 === 0) { blk(ctx, shade(base, -10), 0, 2.4, 8, 0.4, px, py, u); blk(ctx, shade(base, -10), 0, 5, 8, 0.4, px, py, u); }
  } else if (code === T.SOIL) {
    blk(ctx, shade(base, -22), 0, 1.6, 8, 0.7, px, py, u);
    blk(ctx, shade(base, -22), 0, 4.4, 8, 0.7, px, py, u);
    blk(ctx, shade(base, 12), 0, 3.2, 8, 0.3, px, py, u);
  } else if (code === T.SAND) {
    blk(ctx, shade(base, -12), (v % 6) + 1, (v % 5) + 1, 0.8, 0.8, px, py, u);
    blk(ctx, shade(base, 12), (v * 2 % 6) + 1, (v % 6) + 1, 0.6, 0.6, px, py, u);
  }
}

// 물 반짝임 (동적)
export function drawWaterShimmer(ctx, px, py, size, pal, time) {
  const u = size / 8;
  const w = Math.sin(time / 600 + px * 0.06) > 0 ? 1 : 0;
  blk(ctx, shade(pal.water, 30), 1 + w, 2, 2, 0.5, px, py, u);
  blk(ctx, shade(pal.water, 30), 4 - w, 5, 1.8, 0.5, px, py, u);
}

// ---- 자연물 (그림자 + 변형 + 바람) ----
export function drawObject(ctx, o, px, py, size, pal, wind) {
  const u = size / 8;
  const s = o.seed || 0;
  const cx = px + size / 2;
  if (o.type === OBJ.TREE) {
    const scale = 0.82 + (s % 30) / 90; // 0.82~1.15
    const shapeT = s % 3;
    const tint = (s % 20) - 10;
    const leaf = shade(pal.leaf, tint);
    const dark = shade(pal.tree, tint - 4);
    const sway = Math.sin(wind + s) * size * 0.045; // 바람
    const cxC = cx + sway;
    shadow(ctx, cx, py + size - 2, size * 0.3 * scale, size * 0.12);
    blk(ctx, '#6b4a2b', 3.5, 5.2, 1.1, 2.8, px, py, u); // 줄기
    blk(ctx, '#5a3c24', 4.2, 5.2, 0.4, 2.8, px, py, u);
    const rx = size * (shapeT === 2 ? 0.44 : 0.37) * scale;
    const ry = size * (shapeT === 1 ? 0.46 : 0.37) * scale;
    const cyc = py + size * 0.32 - (scale - 1) * size * 0.3;
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cxC, cyc + size * 0.06, rx, ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(cxC, cyc, rx * 0.92, ry * 0.9, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shade(leaf, 24); ctx.beginPath(); ctx.ellipse(cxC - rx * 0.32, cyc - ry * 0.3, rx * 0.34, ry * 0.3, 0, 0, 7); ctx.fill();
  } else if (o.type === OBJ.ROCK) {
    const sc = 0.85 + (s % 20) / 80;
    shadow(ctx, cx, py + size - 3, size * 0.26 * sc, size * 0.1);
    blk(ctx, '#8b8f96', 4 - 2.4 * sc, 3.6, 4.8 * sc, 3 * sc, px, py, u);
    blk(ctx, '#a8adb4', 4 - 1.6 * sc, 3, 3.2 * sc, 1.6 * sc, px, py, u);
    blk(ctx, '#6e7279', 4 - 1.8 * sc, 5.4, 3.6 * sc, 0.9, px, py, u);
  } else if (o.type === OBJ.BUSH) {
    const sway = Math.sin(wind * 1.3 + s) * size * 0.02;
    const cxB = cx + sway;
    shadow(ctx, cx, py + size - 3, size * 0.26, size * 0.1);
    ctx.fillStyle = shade(pal.tree, 6); ctx.beginPath(); ctx.ellipse(cxB, py + size * 0.62, size * 0.3, size * 0.24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = pal.leaf; ctx.beginPath(); ctx.ellipse(cxB, py + size * 0.55, size * 0.26, size * 0.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = shade(pal.leaf, 18); ctx.beginPath(); ctx.ellipse(cxB - size * 0.08, py + size * 0.5, size * 0.1, size * 0.08, 0, 0, 7); ctx.fill();
  } else if (o.type === OBJ.FLOWER) {
    const sway = Math.sin(wind * 1.6 + s) * size * 0.03;
    const colors = ['#ff6fae', '#ffd24a', '#7da7ff', '#ff8a5b', '#c08bff'];
    const col = colors[s % colors.length];
    blk(ctx, '#3e8e41', 3.6, 4.6, 0.7, 2.4, px, py, u);
    blk(ctx, col, 2.9 + sway / u, 2.6, 2.2, 2.2, px, py, u);
    blk(ctx, '#fff35a', 3.7 + sway / u, 3.4, 0.8, 0.8, px, py, u);
  } else if (o.type === OBJ.MUSHROOM) {
    shadow(ctx, cx, py + size - 4, size * 0.14, size * 0.06);
    blk(ctx, '#f2e9d8', 3.6, 5, 1, 1.6, px, py, u); // 대
    blk(ctx, s % 2 ? '#d6553f' : '#c97b3a', 2.8, 3.8, 2.6, 1.5, px, py, u); // 갓
    blk(ctx, '#fff', 3.2, 4.1, 0.5, 0.5, px, py, u);
    blk(ctx, '#fff', 4.2, 4.3, 0.4, 0.4, px, py, u);
  } else if (o.type === OBJ.LOG) {
    shadow(ctx, cx, py + size - 4, size * 0.28, size * 0.08);
    blk(ctx, '#8a6038', 1.6, 4.4, 4.8, 1.8, px, py, u);
    blk(ctx, '#a9794a', 1.6, 4.4, 4.8, 0.6, px, py, u);
    blk(ctx, '#c79a6a', 5.4, 4.6, 1, 1.4, px, py, u); // 단면
    blk(ctx, '#8a6038', 5.7, 4.9, 0.5, 0.7, px, py, u);
  } else if (o.type === OBJ.GRASS) {
    const sway = Math.sin(wind * 2 + s) * size * 0.05;
    const g = pal.grass3 || shade(pal.grass, 18);
    blk(ctx, g, 3 + sway / u, 4.6, 0.5, 2.4, px, py, u);
    blk(ctx, g, 3.8 + sway / u * 1.3, 4.2, 0.5, 2.8, px, py, u);
    blk(ctx, shade(g, 14), 4.6 + sway / u, 4.8, 0.5, 2.2, px, py, u);
  }
}

// 밭 작물
export function drawCrop(ctx, cropId, ratio, ready, px, py, size) {
  const u = size / 8;
  shadow(ctx, px + size / 2, py + size - 4, size * 0.16, size * 0.06);
  const hh = 1 + ratio * 4.5;
  blk(ctx, '#4f8a3a', 3.4, 7 - hh, 1.2, hh, px, py, u);
  if (ready) {
    const c = CROP_COLOR[cropId] || '#e3c45a';
    blk(ctx, c, 2.6, 7 - hh - 0.4, 2.8, 2, px, py, u);
    blk(ctx, shade(c, 30), 3.2, 7 - hh, 1, 1, px, py, u);
  } else if (ratio > 0.4) {
    blk(ctx, '#6fb05a', 2.6, 7 - hh, 2.8, 1.4, px, py, u);
  }
}

// ---- 입체 건물 ----
export function drawBuilding(ctx, b, px, py, size, night) {
  const w = b.w * size, h = b.h * size;
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(px + w / 2, py + h - 3, w * 0.5, size * 0.18, 0, 0, 7);
  ctx.fill();

  const wallTop = py + h * 0.36;
  // 벽 + 음영 그라데이션
  const wg = ctx.createLinearGradient(px, wallTop, px, py + h);
  wg.addColorStop(0, '#d4b078'); wg.addColorStop(1, '#b58d54');
  ctx.fillStyle = wg;
  ctx.fillRect(px, wallTop, w, h - h * 0.36);
  // 처마(벽 위 그림자)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(px, wallTop, w, 4);

  // 지붕 (그라데이션 + 능선)
  const rg = ctx.createLinearGradient(px, py, px, wallTop + 4);
  rg.addColorStop(0, '#c2574a'); rg.addColorStop(1, '#8e3a30');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(px - 5, wallTop + 4);
  ctx.lineTo(px + w / 2, py - 3);
  ctx.lineTo(px + w + 5, wallTop + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6f2c24'; // 능선
  ctx.fillRect(px - 5, wallTop + 1, w + 10, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; // 지붕 하이라이트
  ctx.beginPath();
  ctx.moveTo(px + w / 2, py - 3);
  ctx.lineTo(px + w / 2 + 6, wallTop + 2);
  ctx.lineTo(px + w / 2 - 6, wallTop + 2);
  ctx.closePath();
  ctx.fill();

  // 굴뚝
  ctx.fillStyle = '#7e5a44';
  ctx.fillRect(px + w * 0.7, py + h * 0.05, size * 0.22, h * 0.3);
  ctx.fillStyle = '#5e4233';
  ctx.fillRect(px + w * 0.7, py + h * 0.05, size * 0.22, 3);

  // 문 (틀 + 손잡이)
  const dw = size * 0.5, dh = h * 0.42, dx = px + w / 2 - dw / 2, dy = py + h - dh;
  ctx.fillStyle = '#5a3c24'; ctx.fillRect(dx - 2, dy - 2, dw + 4, dh + 2);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = '#e0c060'; ctx.fillRect(dx + dw - 5, dy + dh / 2, 3, 3);

  // 창문 (틀 + 빛/유리, 밤엔 발광)
  const winY = wallTop + (h - h * 0.36) * 0.28;
  const winS = size * 0.28;
  for (const wx of [px + w * 0.2, px + w * 0.8 - winS]) {
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(wx - 2, winY - 2, winS + 4, winS + 4);
    ctx.fillStyle = night ? '#ffe27a' : '#9fd4ec';
    ctx.fillRect(wx, winY, winS, winS);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(wx + winS / 2 - 1, winY, 2, winS);
    ctx.fillRect(wx, winY + winS / 2 - 1, winS, 2);
  }
  if (night) {
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffe27a';
    ctx.fillRect(px, wallTop, w, h - h * 0.36); ctx.restore();
  }
}

// 배치형 장식물 (그림자 포함)
export function drawPlaceable(ctx, type, px, py, size, night) {
  const u = size / 8;
  shadow(ctx, px + size / 2, py + size - 3, size * 0.26, size * 0.1);
  if (type === 'house') {
    const wg = ctx.createLinearGradient(px, py + size * 0.4, px, py + size);
    wg.addColorStop(0, '#d4b078'); wg.addColorStop(1, '#b58d54');
    ctx.fillStyle = wg; ctx.fillRect(px + 2, py + size * 0.42, size - 4, size * 0.58);
    ctx.fillStyle = '#9a4a3e';
    ctx.beginPath(); ctx.moveTo(px - 1, py + size * 0.46); ctx.lineTo(px + size / 2, py + 1); ctx.lineTo(px + size + 1, py + size * 0.46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f2c24'; ctx.fillRect(px - 1, py + size * 0.43, size + 2, 3);
    ctx.fillStyle = night ? '#ffe27a' : '#6b4a2b'; blk(ctx, ctx.fillStyle, 3.2, 5.2, 1.6, 2.4, px, py, u);
    ctx.fillStyle = night ? '#ffe27a' : '#9fd4ec'; blk(ctx, ctx.fillStyle, 1.4, 5, 1.3, 1.3, px, py, u);
  } else if (type === 'well') {
    ctx.fillStyle = '#8b8f96'; ctx.fillRect(px + size * 0.25, py + size * 0.42, size * 0.5, size * 0.5);
    ctx.fillStyle = '#3f9fe0'; blk(ctx, '#3f9fe0', 3, 4.2, 2, 1.3, px, py, u);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(px + size * 0.18, py + size * 0.18, size * 0.64, 3);
    ctx.fillStyle = '#8a3a30'; ctx.fillRect(px + size * 0.24, py + size * 0.05, 3, size * 0.18); ctx.fillRect(px + size * 0.7, py + size * 0.05, 3, size * 0.18);
  } else if (type === 'lamp') {
    ctx.fillStyle = '#444'; ctx.fillRect(px + size / 2 - 2, py + size * 0.3, 4, size * 0.6);
    ctx.fillStyle = night ? '#ffd24a' : '#cdb24a';
    ctx.beginPath(); ctx.arc(px + size / 2, py + size * 0.3, size * 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(px + size / 2 - size * 0.16, py + size * 0.18, size * 0.32, 3);
  } else if (type === 'fence') {
    ctx.fillStyle = '#9a7448';
    blk(ctx, '#9a7448', 1, 2, 6, 1, px, py, u);
    blk(ctx, '#9a7448', 1.6, 1, 1, 5, px, py, u);
    blk(ctx, '#9a7448', 5.4, 1, 1, 5, px, py, u);
    blk(ctx, '#7c5c38', 1, 3.4, 6, 0.5, px, py, u);
  } else if (type === 'flowerpot') {
    ctx.fillStyle = '#b5651d'; blk(ctx, '#b5651d', 2.6, 5, 2.8, 2, px, py, u);
    ctx.fillStyle = '#3e8e41'; blk(ctx, '#3e8e41', 3.4, 4, 1.2, 1.4, px, py, u);
    ctx.fillStyle = '#ff6fae'; blk(ctx, '#ff6fae', 2.9, 2.8, 1.3, 1.3, px, py, u);
    ctx.fillStyle = '#ffd24a'; blk(ctx, '#ffd24a', 4.2, 3.2, 1.1, 1.1, px, py, u);
  }
}

export function drawLampGlow(ctx, px, py, size) {
  const g = ctx.createRadialGradient(px + size / 2, py + size * 0.3, 2, px + size / 2, py + size * 0.3, size * 2.4);
  g.addColorStop(0, 'rgba(255,220,120,0.55)');
  g.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(px - size * 2, py - size * 2, size * 5, size * 5);
}

// 플레이어
export function drawPlayer(ctx, px, py, size, facing, frame) {
  const u = size / 8;
  const bob = frame ? 0 : 0.4;
  shadow(ctx, px + size / 2, py + size - 3, size * 0.28, size * 0.11);
  blk(ctx, '#3f6fb0', 2.6, 4 + bob, 2.8, 2.6, px, py, u);
  blk(ctx, '#2f5690', 2.6, 5.6 + bob, 2.8, 1, px, py, u);
  blk(ctx, '#f0c9a0', 2.8, 1.6 + bob, 2.4, 2.2, px, py, u);
  blk(ctx, '#c0492f', 2.5, 1 + bob, 3, 1, px, py, u);
  let ex = 3.4;
  if (facing === 'left') ex = 2.9; else if (facing === 'right') ex = 3.9;
  if (facing !== 'up') blk(ctx, '#2b2b2b', ex, 2.4 + bob, 0.7, 0.7, px, py, u);
}

// NPC (걷기 살짝 바운스)
export function drawNPC(ctx, px, py, size, color, frame) {
  const u = size / 8;
  const bob = frame ? 0 : 0.4;
  shadow(ctx, px + size / 2, py + size - 3, size * 0.26, size * 0.1);
  blk(ctx, color, 2.7, 4 + bob, 2.6, 2.6, px, py, u);
  blk(ctx, shade(color, -24), 2.7, 5.6 + bob, 2.6, 1, px, py, u);
  blk(ctx, '#f0c9a0', 2.9, 1.8 + bob, 2.2, 2.1, px, py, u);
  blk(ctx, '#3a2e25', 2.7, 1.3 + bob, 2.6, 0.9, px, py, u);
}
