// 월드 런타임: requestAnimationFrame 게임 루프 + 입력 + 카메라/줌 + 낮밤 + NPC + 도구
//  시뮬레이션 상태(state)는 React reducer가 관리하고, 여기서는 실시간 표현/이동을 담당한다.

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  WTILE, WORLD_W, WORLD_H, TERRAIN, T, OBJECTS, BUILDINGS, NPCS, PLAYER_START,
  FARM, terrainAt, objectAt, doorAt, buildingHitAt, isWalkable, plotIndexAt, PLACEABLES,
} from '../game/world/worldgen';
import {
  drawTile, drawObject, drawCrop, drawBuilding, drawPlaceable, drawLampGlow, drawPlayer, drawNPC,
} from '../game/world/draw';
import { paletteFor, nightOverlay, isNight, clockString } from '../game/world/palette';
import { CROPS } from '../game/crops';
import { JOBS, JOB_SITE } from '../game/workers';

const DAY_REAL_SEC = 100; // 실제 100초 = 게임 하루
const SPEED = { pause: 0, x1: 1, x2: 2.5 };
const PLAYER_SPEED = 4.6; // 타일/초
const RADIUS = 0.32;

export function useWorld({ state, time, actions }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  // 시뮬 상태 최신본 참조
  const stateRef = useRef(state);
  stateRef.current = state;
  const seasonRef = useRef(time.season.id);
  seasonRef.current = time.season.id;

  // 월드 런타임 (ref: 매 프레임 갱신, 리렌더 X)
  const player = useRef({ x: PLAYER_START.x + 0.5, y: PLAYER_START.y + 0.5, facing: 'down', frame: 0, moveT: 0 });
  const cam = useRef({ x: 0, y: 0 });
  const npcs = useRef(NPCS.map((n) => ({ ...n, x: n.path[0][0] + 0.5, y: n.path[0][1] + 0.5, wp: 0, wait: 0 })));
  const workerNpcs = useRef([]);
  const clock = useRef(0.32); // 0~1 하루 진행 (아침 시작)
  const keys = useRef(new Set());
  const cooldown = useRef(0);
  const size = useRef({ w: 800, h: 500, dpr: 1 });
  const joy = useRef({ active: false, dx: 0, dy: 0 });

  // UI 표시 상태 (저빈도 동기화)
  const [tool, setTool] = useState('axe'); // axe|pickaxe|rod|seeds
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [placeType, setPlaceType] = useState(null);
  const [zoom, setZoom] = useState(1.4);
  const [speedId, setSpeedId] = useState('x1');
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [hud, setHud] = useState({ clock: '08:00', night: false });

  const toolRef = useRef(tool); toolRef.current = tool;
  const cropRef = useRef(selectedCrop); cropRef.current = selectedCrop;
  const placeRef = useRef(placeType); placeRef.current = placeType;
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const speedRef = useRef(speedId); speedRef.current = speedId;
  const modalRef = useRef(activeBuilding); modalRef.current = activeBuilding;

  const removedSet = useCallback(() => new Set(stateRef.current.removed.map((r) => r.key)), []);
  const placedSolid = useCallback(() => {
    const s = new Set();
    for (const p of stateRef.current.placed) if (PLACEABLES[p.type]?.solid) s.add(`${p.x},${p.y}`);
    return s;
  }, []);

  // 상호작용 (대상 타일)
  const interact = useCallback((tx, ty) => {
    if (cooldown.current > 0) return;
    const st = stateRef.current;
    // 배치 모드
    if (placeRef.current) {
      const pdef = PLACEABLES[placeRef.current];
      const blocked = !isWalkable(tx, ty, removedSet(), placedSolid()) || buildingHitAt(tx, ty);
      if (blocked || terrainAt(tx, ty) === T.SOIL) return;
      actions.place(placeRef.current, tx, ty, { wood: pdef.wood, stone: pdef.stone });
      cooldown.current = 0.2;
      return;
    }
    // 건물/문 → 진입
    const b = buildingHitAt(tx, ty);
    if (b) { setActiveBuilding(b); return; }
    // 도구별 행동
    const tool = toolRef.current;
    const o = objectAt(tx, ty);
    const rm = removedSet();
    if (tool === 'axe' && o && o.type === 'tree' && !rm.has(`${tx},${ty}`)) {
      actions.chop(`${tx},${ty}`); cooldown.current = 0.3; return;
    }
    if (tool === 'pickaxe' && o && o.type === 'rock' && !rm.has(`${tx},${ty}`)) {
      actions.mine(`${tx},${ty}`); cooldown.current = 0.3; return;
    }
    if (tool === 'rod') {
      const nearWater = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(
        ([dx, dy]) => terrainAt(tx + dx, ty + dy) === T.WATER
      );
      if (nearWater) { actions.fish('lake'); cooldown.current = 0.35; return; }
    }
    if (tool === 'seeds') {
      const idx = plotIndexAt(tx, ty);
      if (idx >= 0 && idx < st.farm.length) {
        const plot = st.farm[idx];
        if (!plot) actions.plant(idx, cropRef.current);
        else {
          const crop = CROPS[plot.cropId];
          if (st.day - plot.plantedDay >= crop.growthDays) actions.harvest(idx);
        }
        cooldown.current = 0.2;
      }
    }
  }, [actions, removedSet, placedSolid]);

  // 정면 타일 상호작용 (키보드 액션)
  const interactFront = useCallback(() => {
    const p = player.current;
    const fx = Math.floor(p.x) + (p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0);
    const fy = Math.floor(p.y) + (p.facing === 'up' ? -1 : p.facing === 'down' ? 1 : 0);
    interact(fx, fy);
  }, [interact]);

  // 키 입력
  useEffect(() => {
    const down = (e) => {
      if (modalRef.current) { if (e.key === 'Escape') setActiveBuilding(null); return; }
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
      if (k === ' ' || k === 'e') { interactFront(); return; }
      if (k === '1') setTool('axe');
      else if (k === '2') setTool('pickaxe');
      else if (k === '3') setTool('rod');
      else if (k === '4') setTool('seeds');
      else if (k === 'escape') setPlaceType(null);
      else keys.current.add(k);
    };
    const up = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [interactFront]);

  // 고용한 일꾼을 맵 위 NPC로 표현 (최대 12명 렌더)
  const workersKey = JSON.stringify(state.workers);
  useEffect(() => {
    const arr = [];
    let total = 0;
    for (const job of Object.keys(state.workers)) {
      const n = state.workers[job];
      const site = JOB_SITE[JOBS[job].site];
      for (let i = 0; i < n && total < 12; i++, total++) {
        const ox = (total % 3) - 1, oy = Math.floor(total / 3) % 2;
        const cx = site.x + ox, cy = site.y + oy;
        arr.push({
          color: JOBS[job].color, x: cx + 0.5, y: cy + 0.5, wp: 0, wait: i * 0.3,
          path: [[cx, cy], [cx + 1, cy], [cx + 1, cy + 1], [cx, cy + 1]],
        });
      }
    }
    workerNpcs.current = arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workersKey]);

  // 캔버스 크기 맞추기
  useEffect(() => {
    const fit = () => {
      const el = wrapRef.current, cv = canvasRef.current;
      if (!el || !cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth, h = el.clientHeight;
      size.current = { w, h, dpr };
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // 게임 루프
  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt, now);
      render(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveAxis(p, nx, ny, rm, ps) {
    // 박스 4코너 충돌 검사
    const corners = [
      [nx - RADIUS, ny - RADIUS], [nx + RADIUS, ny - RADIUS],
      [nx - RADIUS, ny + RADIUS], [nx + RADIUS, ny + RADIUS],
    ];
    for (const [cx, cy] of corners) {
      if (!isWalkable(Math.floor(cx), Math.floor(cy), rm, ps)) return false;
    }
    return true;
  }

  function update(dt, now) {
    if (cooldown.current > 0) cooldown.current -= dt;
    const p = player.current;
    const rm = removedSet(), ps = placedSolid();

    // 이동
    if (!modalRef.current) {
      let dx = 0, dy = 0;
      const k = keys.current;
      if (k.has('w') || k.has('arrowup')) dy -= 1;
      if (k.has('s') || k.has('arrowdown')) dy += 1;
      if (k.has('a') || k.has('arrowleft')) dx -= 1;
      if (k.has('d') || k.has('arrowright')) dx += 1;
      // 조이스틱
      if (joy.current.active) { dx += joy.current.dx; dy += joy.current.dy; }
      const len = Math.hypot(dx, dy);
      if (len > 0.1) {
        dx /= len; dy /= len;
        if (Math.abs(dx) > Math.abs(dy)) p.facing = dx < 0 ? 'left' : 'right';
        else p.facing = dy < 0 ? 'up' : 'down';
        const step = PLAYER_SPEED * dt;
        const nx = p.x + dx * step, ny = p.y + dy * step;
        if (moveAxis(p, nx, p.y, rm, ps)) p.x = nx;
        if (moveAxis(p, p.x, ny, rm, ps)) p.y = ny;
        p.moveT += dt;
        p.frame = Math.floor(p.moveT * 8) % 2;
        // 문 진입
        const d = doorAt(Math.floor(p.x), Math.floor(p.y));
        if (d && !modalRef.current) setActiveBuilding(d);
      } else { p.frame = 0; }
    }

    // NPC 이동 (주민 + 고용 일꾼)
    const stepNpc = (n, speed) => {
      if (n.wait > 0) { n.wait -= dt; return; }
      const [tx, ty] = n.path[n.wp];
      const gx = tx + 0.5, gy = ty + 0.5;
      const ddx = gx - n.x, ddy = gy - n.y;
      const d = Math.hypot(ddx, ddy);
      if (d < 0.08) { n.wp = (n.wp + 1) % n.path.length; n.wait = 0.6 + Math.random(); }
      else { const s = speed * dt; n.x += (ddx / d) * s; n.y += (ddy / d) * s; }
    };
    for (const n of npcs.current) stepNpc(n, 2.2);
    for (const n of workerNpcs.current) stepNpc(n, 1.8);

    // 시계 (낮/밤) → 하루 경과 시 시뮬 진행
    const mult = SPEED[speedRef.current];
    if (mult > 0) {
      clock.current += (dt / DAY_REAL_SEC) * mult;
      if (clock.current >= 1) { clock.current -= 1; actions.nextDay(); }
    }

    // 카메라
    const tileSize = WTILE * zoomRef.current;
    const { w, h } = size.current;
    let cx = p.x * tileSize - w / 2;
    let cy = p.y * tileSize - h / 2;
    cx = Math.max(0, Math.min(WORLD_W * tileSize - w, cx));
    cy = Math.max(0, Math.min(WORLD_H * tileSize - h, cy));
    if (WORLD_W * tileSize < w) cx = (WORLD_W * tileSize - w) / 2;
    if (WORLD_H * tileSize < h) cy = (WORLD_H * tileSize - h) / 2;
    cam.current.x = cx; cam.current.y = cy;

    // HUD 동기화 (가끔)
    if (!update._t || now - update._t > 250) {
      update._t = now;
      setHud({ clock: clockString(clock.current), night: isNight(clock.current) });
    }
  }

  function render() {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    const st = stateRef.current;
    const pal = paletteFor(seasonRef.current);
    const tileSize = WTILE * zoomRef.current;
    const camX = cam.current.x, camY = cam.current.y;
    const x0 = Math.max(0, Math.floor(camX / tileSize));
    const y0 = Math.max(0, Math.floor(camY / tileSize));
    const x1 = Math.min(WORLD_W, Math.ceil((camX + w) / tileSize));
    const y1 = Math.min(WORLD_H, Math.ceil((camY + h) / tileSize));
    const now = performance.now();

    // 지형
    for (let ty = y0; ty < y1; ty++)
      for (let tx = x0; tx < x1; tx++)
        drawTile(ctx, TERRAIN[ty][tx], tx, ty, tx * tileSize - camX, ty * tileSize - camY, tileSize, pal, now);

    // 깊이 정렬 스프라이트 수집
    const rm = new Set(st.removed.map((r) => r.key));
    const sprites = [];
    for (const o of OBJECTS) {
      if (o.x < x0 - 1 || o.x > x1 || o.y < y0 - 1 || o.y > y1) continue;
      if (rm.has(`${o.x},${o.y}`)) continue;
      sprites.push({ y: o.y + 0.9, fn: () => drawObject(ctx, o.type, o.x * tileSize - camX, o.y * tileSize - camY, tileSize, pal) });
    }
    // 밭 작물
    for (let i = 0; i < st.farm.length; i++) {
      const plot = st.farm[i]; if (!plot) continue;
      const px = FARM.x + (i % FARM.cols), py = FARM.y + Math.floor(i / FARM.cols);
      const crop = CROPS[plot.cropId];
      const ratio = Math.min(1, (st.day - plot.plantedDay) / crop.growthDays);
      const ready = ratio >= 1;
      sprites.push({ y: py + 0.95, fn: () => drawCrop(ctx, plot.cropId, ratio, ready, px * tileSize - camX, py * tileSize - camY, tileSize) });
    }
    // 배치물
    for (const pl of st.placed) {
      sprites.push({ y: pl.y + 0.95, fn: () => drawPlaceable(ctx, pl.type, pl.x * tileSize - camX, pl.y * tileSize - camY, tileSize, isNight(clock.current)) });
    }
    // 건물
    for (const b of BUILDINGS) {
      sprites.push({ y: b.y + b.h, fn: () => drawBuilding(ctx, b, b.x * tileSize - camX, b.y * tileSize - camY, tileSize, isNight(clock.current)) });
    }
    // NPC (주민 + 일꾼)
    for (const n of npcs.current) {
      sprites.push({ y: n.y, fn: () => drawNPC(ctx, n.x * tileSize - camX - tileSize / 2, n.y * tileSize - camY - tileSize / 2, tileSize, n.color) });
    }
    for (const n of workerNpcs.current) {
      if (n.x < x0 - 1 || n.x > x1 + 1 || n.y < y0 - 1 || n.y > y1 + 1) continue;
      sprites.push({ y: n.y, fn: () => drawNPC(ctx, n.x * tileSize - camX - tileSize / 2, n.y * tileSize - camY - tileSize / 2, tileSize, n.color) });
    }
    // 플레이어
    const p = player.current;
    sprites.push({ y: p.y, fn: () => drawPlayer(ctx, p.x * tileSize - camX - tileSize / 2, p.y * tileSize - camY - tileSize / 2, tileSize, p.facing, p.frame) });

    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.fn();

    // 배치 모드 커서 (정면 타일 표시)
    if (placeRef.current) {
      const tx = Math.floor(p.x) + (p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0);
      const ty = Math.floor(p.y) + (p.facing === 'up' ? -1 : p.facing === 'down' ? 1 : 0);
      ctx.strokeStyle = 'rgba(255,255,120,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx * tileSize - camX, ty * tileSize - camY, tileSize, tileSize);
    }

    // 낮/밤 조명
    const ov = nightOverlay(clock.current);
    if (!ov.endsWith('0)')) {
      ctx.fillStyle = ov;
      ctx.fillRect(0, 0, w, h);
      // 가로등/창문 빛
      if (isNight(clock.current)) {
        ctx.globalCompositeOperation = 'lighter';
        for (const pl of st.placed) {
          if (PLACEABLES[pl.type]?.light)
            drawLampGlow(ctx, pl.x * tileSize - camX, pl.y * tileSize - camY, tileSize);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }

  // 조이스틱 (모바일)
  const joyStart = useCallback(() => { joy.current.active = true; }, []);
  const joyMove = useCallback((dx, dy) => { joy.current.dx = dx; joy.current.dy = dy; }, []);
  const joyEnd = useCallback(() => { joy.current.active = false; joy.current.dx = 0; joy.current.dy = 0; }, []);

  // 캔버스 클릭 → 타일 상호작용
  const onCanvasClick = useCallback((e) => {
    if (modalRef.current) return;
    const cv = canvasRef.current; const rect = cv.getBoundingClientRect();
    const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;
    const tileSize = WTILE * zoomRef.current;
    const tx = Math.floor((cssX + cam.current.x) / tileSize);
    const ty = Math.floor((cssY + cam.current.y) / tileSize);
    interact(tx, ty);
  }, [interact]);

  return {
    canvasRef, wrapRef, onCanvasClick,
    tool, setTool, selectedCrop, setSelectedCrop,
    placeType, setPlaceType,
    zoom, setZoom, speedId, setSpeedId,
    activeBuilding, setActiveBuilding,
    hud,
    joy: { joyStart, joyMove, joyEnd },
    interactFront,
  };
}
