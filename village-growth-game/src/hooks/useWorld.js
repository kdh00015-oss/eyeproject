// 월드 런타임: 게임 루프 + 입력 + 카메라/줌 + 낮밤 + NPC + 도구 + 다중 맵(마을/들판) 이동

import { useRef, useState, useEffect, useCallback } from 'react';
import { MAPS, MAP_META, WTILE, T, PLACEABLES } from '../game/world/worldgen';
import {
  drawTile, drawWaterShimmer, drawObject, drawCrop, drawBuilding, drawPlaceable, drawLampGlow, drawPlayer, drawNPC,
} from '../game/world/draw';
import { paletteFor, ambientOverlay, isNight, clockString } from '../game/world/palette';
import { CROPS } from '../game/crops';
import { ANIMAL_LIST } from '../game/livestock';
import { JOBS, JOB_SITE } from '../game/workers';

const DAY_REAL_SEC = 420; // 하루 길이(초) — 더 천천히 흐르게
const SPEED = { pause: 0, x1: 1, x2: 2.5 };
const PLAYER_SPEED = 4.4;
const RADIUS = 0.32;
const TREE_HITS = 3; // 나무는 3번 베어야 쓰러짐
const ROCK_HITS = 4; // 바위는 4번 캐야 부서짐

// 채집 진행 표시 (노드 위 작은 점)
function drawNodeHits(ctx, px, py, size, done, need) {
  const r = size * 0.06, gap = size * 0.16, total = (need - 1) * gap;
  const sx = px + size / 2 - total / 2, sy = py + size * 0.08;
  for (let i = 0; i < need; i++) {
    ctx.fillStyle = i < done ? '#f4c542' : 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(sx + i * gap, sy, r, 0, 7); ctx.fill();
  }
}

export function useWorld({ state, time, actions }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(state); stateRef.current = state;
  const seasonRef = useRef(time.season.id); seasonRef.current = time.season.id;

  const [mapId, setMapId] = useState('village');
  const mapIdRef = useRef('village');
  const getMap = () => MAPS[mapIdRef.current];

  const player = useRef({ x: MAPS.village.PLAYER_START.x + 0.5, y: MAPS.village.PLAYER_START.y + 0.5, facing: 'down', frame: 0, moveT: 0 });
  const cam = useRef({ x: 0, y: 0 });
  const npcs = useRef(MAPS.village.NPCS.map((n) => ({ ...n, x: n.path[0][0] + 0.5, y: n.path[0][1] + 0.5, wp: 0, wait: 0 })));
  const workerNpcs = useRef([]);
  const clock = useRef(0.32);
  const keys = useRef(new Set());
  const cooldown = useRef(0);
  const travelCd = useRef(0);
  const size = useRef({ w: 800, h: 500, dpr: 1 });
  const joy = useRef({ active: false, dx: 0, dy: 0 });
  const zoomCur = useRef(1.4);
  const terrainCache = useRef(null);
  const cacheKey = useRef(null);

  const [tool, setTool] = useState('axe');
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [placeType, setPlaceType] = useState(null);
  const [zoom, setZoom] = useState(1.4);
  const [speedId, setSpeedId] = useState('x1');
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [hud, setHud] = useState({ clock: '08:00', night: false });
  const [showMap, setShowMap] = useState(false);
  const miniRef = useRef(null);
  const [talkNpc, setTalkNpc] = useState(null);
  const talkRef = useRef(talkNpc); talkRef.current = talkNpc;
  const [run, setRun] = useState(false);
  const runRef = useRef(run); runRef.current = run;
  const hits = useRef(new Map()); // 노드별 타격 누적
  const hitFx = useRef(null); // 최근 타격 연출 {key,t}

  const toolRef = useRef(tool); toolRef.current = tool;
  const cropRef = useRef(selectedCrop); cropRef.current = selectedCrop;
  const placeRef = useRef(placeType); placeRef.current = placeType;
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const speedRef = useRef(speedId); speedRef.current = speedId;
  const modalRef = useRef(activeBuilding); modalRef.current = activeBuilding;
  const showMapRef = useRef(showMap); showMapRef.current = showMap;

  // 현재 맵의 벌목/채굴 제거 집합 (맵별 네임스페이스)
  const removedSet = useCallback(() => {
    const m = mapIdRef.current;
    const s = new Set();
    for (const r of stateRef.current.removed) {
      const i = r.key.indexOf(':');
      if (i >= 0) { if (r.key.slice(0, i) === m) s.add(r.key.slice(i + 1)); }
      else if (m === 'village') s.add(r.key);
    }
    return s;
  }, []);
  const placedSolid = useCallback(() => {
    const m = mapIdRef.current;
    const s = new Set();
    for (const p of stateRef.current.placed) {
      if ((p.map || 'village') === m && PLACEABLES[p.type]?.solid) s.add(`${p.x},${p.y}`);
    }
    return s;
  }, []);

  // 맵 이동
  const travel = useCallback((to, at) => {
    mapIdRef.current = to;
    setMapId(to);
    if (actions.visitMap) actions.visitMap(to);
    player.current.x = at.x + 0.5;
    player.current.y = at.y + 0.5;
    npcs.current = MAPS[to].NPCS.map((n) => ({ ...n, x: n.path[0][0] + 0.5, y: n.path[0][1] + 0.5, wp: 0, wait: 0 }));
    cacheKey.current = null; // 지형 캐시 재생성
    hits.current.clear(); // 채집 타격 누적 초기화
    travelCd.current = 0.6;
    cam.current.x = at.x * WTILE * zoomCur.current - size.current.w / 2;
    cam.current.y = at.y * WTILE * zoomCur.current - size.current.h / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 전체 지도에서 클릭으로 지역 이동 (현재 맵의 출구 도착점 사용 → 없으면 시작점)
  const travelTo = useCallback((targetId) => {
    if (!MAPS[targetId] || targetId === mapIdRef.current) return;
    const M = getMap();
    const ex = M.EXITS.find((e) => e.to === targetId);
    const at = ex ? ex.at : MAPS[targetId].PLAYER_START;
    travel(targetId, at);
  }, [travel]);

  // 상호작용 (대상 타일)
  const interact = useCallback((tx, ty) => {
    if (cooldown.current > 0) return;
    const M = getMap();
    if (placeRef.current) {
      const blocked = !M.isWalkable(tx, ty, removedSet(), placedSolid()) || M.buildingHitAt(tx, ty);
      if (blocked || M.terrainAt(tx, ty) === T.SOIL) return;
      actions.place(placeRef.current, tx, ty, M.id);
      cooldown.current = 0.2; return;
    }
    const b = M.buildingHitAt(tx, ty);
    if (b) { setActiveBuilding(b); return; }
    const tool = toolRef.current;
    const o = M.objectAt(tx, ty);
    const rm = removedSet();
    // 여러 번 타격해야 채집되는 노드
    const hitNode = (need, type, fn) => {
      const key = `${tx},${ty}`;
      const h = (hits.current.get(key) || 0) + 1;
      hitFx.current = { key, t: performance.now() };
      cooldown.current = 0.32;
      if (h >= need) { hits.current.delete(key); fn(`${M.id}:${tx},${ty}`); }
      else hits.current.set(key, h);
    };
    if (tool === 'axe' && o && o.type === 'tree' && !rm.has(`${tx},${ty}`)) { hitNode(TREE_HITS, 'tree', actions.chop); return; }
    if (tool === 'pickaxe' && o && o.type === 'rock' && !rm.has(`${tx},${ty}`)) { hitNode(ROCK_HITS, 'rock', actions.mine); return; }
    if (tool === 'rod') {
      const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => M.terrainAt(tx + dx, ty + dy) === T.WATER);
      if (near) { actions.fish('lake'); cooldown.current = 0.35; return; }
    }
    if (tool === 'seeds') {
      const idx = M.plotIndexAt(tx, ty);
      if (idx >= 0) {
        const farm = stateRef.current.farm;
        if (idx >= farm.length) {
          // 미개간(잠긴) 칸: 바로 다음 칸이면 개간, 아니면 무시
          if (idx === farm.length) actions.reclaim();
        } else {
          const plot = farm[idx];
          if (!plot) actions.plant(idx, cropRef.current);
          else actions.harvest(idx); // 익었는지는 리듀서가 판단
        }
        cooldown.current = 0.25;
      }
    }
  }, [actions, removedSet, placedSolid]);

  // 정면/주변 상호작용
  const interactFront = useCallback(() => {
    const p = player.current;
    const M = getMap();
    const cx = Math.floor(p.x), cy = Math.floor(p.y);
    const fx = cx + (p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0);
    const fy = cy + (p.facing === 'up' ? -1 : p.facing === 'down' ? 1 : 0);
    if (placeRef.current) { interact(fx, fy); return; }
    const cands = [[fx, fy]];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cands.push([cx + dx, cy + dy]);
    // 1) 인접한 건물 문 → 진입 (걸을 때 자동 진입 X, 행동키로만)
    for (const [tx, ty] of cands) {
      const b = M.buildingHitAt(tx, ty);
      if (b && b.door.x === tx && b.door.y === ty) { setActiveBuilding(b); return; }
    }
    // 2) 인접한 마을 NPC → 대화/거래
    let bn = null, bnd = 1.4;
    for (const n of npcs.current) { if (!n.name) continue; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bnd) { bnd = d; bn = n; } }
    if (bn) { setTalkNpc(bn); return; }
    const rm = removedSet();
    const tool = toolRef.current;
    const match = (tx, ty) => {
      const b = M.buildingHitAt(tx, ty);
      if (b && b.door.x === tx && b.door.y === ty) return true;
      if (tool === 'axe') { const o = M.objectAt(tx, ty); return o && o.type === 'tree' && !rm.has(`${tx},${ty}`); }
      if (tool === 'pickaxe') { const o = M.objectAt(tx, ty); return o && o.type === 'rock' && !rm.has(`${tx},${ty}`); }
      if (tool === 'rod') return M.terrainAt(tx, ty) === T.WATER;
      if (tool === 'seeds') return M.plotIndexAt(tx, ty) >= 0;
      return false;
    };
    let best = null, bd = 99;
    for (const [tx, ty] of cands) {
      if (!match(tx, ty)) continue;
      const d = Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y);
      if (d < bd) { bd = d; best = [tx, ty]; }
    }
    interact(best ? best[0] : fx, best ? best[1] : fy);
  }, [interact, removedSet]);

  // 키 입력
  useEffect(() => {
    const down = (e) => {
      if (talkRef.current) { if (e.key === 'Escape') setTalkNpc(null); return; }
      if (modalRef.current) { if (e.key === 'Escape') setActiveBuilding(null); return; }
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ' || k === 'e') { interactFront(); return; }
      if (k === '1') setTool('axe'); else if (k === '2') setTool('pickaxe');
      else if (k === '3') setTool('rod'); else if (k === '4') setTool('seeds');
      else if (k === 'm') setShowMap((v) => !v);
      else if (k === 'escape') setPlaceType(null);
      else keys.current.add(k);
    };
    const up = (e) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [interactFront]);

  // 고용 일꾼 NPC (마을에서만)
  const workersKey = state.workers.map((w) => w.id + w.job).join(',');
  useEffect(() => {
    const arr = [];
    if (mapIdRef.current === 'village') {
      state.workers.slice(0, 14).forEach((w, total) => {
        const job = JOBS[w.job];
        const site = JOB_SITE[job.site];
        const ox = (total % 3) - 1, oy = Math.floor(total / 3) % 2;
        const cx = site.x + ox, cy = site.y + oy;
        arr.push({
          color: job.color, icon: job.icon, name: w.name, resting: w.resting,
          x: cx + 0.5, y: cy + 0.5, wp: 0, wait: total * 0.3,
          path: [[cx, cy], [cx + 1, cy], [cx + 1, cy + 1], [cx, cy + 1]],
        });
      });
    }
    workerNpcs.current = arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workersKey, mapId]);

  // 캔버스 크기
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
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveAxis(nx, ny, M, rm, ps) {
    for (const [cx, cy] of [[nx - RADIUS, ny - RADIUS], [nx + RADIUS, ny - RADIUS], [nx - RADIUS, ny + RADIUS], [nx + RADIUS, ny + RADIUS]]) {
      if (!M.isWalkable(Math.floor(cx), Math.floor(cy), rm, ps)) return false;
    }
    return true;
  }

  function update(dt, now) {
    if (cooldown.current > 0) cooldown.current -= dt;
    if (travelCd.current > 0) travelCd.current -= dt;
    const p = player.current;
    const M = getMap();
    const rm = removedSet(), ps = placedSolid();

    if (!modalRef.current && !talkRef.current) {
      let dx = 0, dy = 0;
      const k = keys.current;
      if (k.has('w') || k.has('arrowup')) dy -= 1;
      if (k.has('s') || k.has('arrowdown')) dy += 1;
      if (k.has('a') || k.has('arrowleft')) dx -= 1;
      if (k.has('d') || k.has('arrowright')) dx += 1;
      if (joy.current.active) { dx += joy.current.dx; dy += joy.current.dy; }
      const len = Math.hypot(dx, dy);
      if (len > 0.1) {
        dx /= len; dy /= len;
        if (Math.abs(dx) > Math.abs(dy)) p.facing = dx < 0 ? 'left' : 'right';
        else p.facing = dy < 0 ? 'up' : 'down';
        const sprint = (keys.current.has('shift') || runRef.current) ? 1.85 : 1; // 빠른 달리기
        const step = PLAYER_SPEED * sprint * dt;
        if (moveAxis(p.x + dx * step, p.y, M, rm, ps)) p.x += dx * step;
        if (moveAxis(p.x, p.y + dy * step, M, rm, ps)) p.y += dy * step;
        p.moveT += dt; p.frame = Math.floor(p.moveT * (sprint > 1 ? 12 : 8)) % 2;
        // 출구 → 맵 이동 (경계는 자동, 건물 문은 행동키로만)
        if (travelCd.current <= 0) {
          const ex = M.exitAt(Math.floor(p.x), Math.floor(p.y));
          if (ex) { travel(ex.to, ex.at); return; }
        }
      } else { p.frame = 0; }
    }

    const stepNpc = (n, speed) => {
      if (n.wait > 0) { n.wait -= dt; return; }
      const [tx, ty] = n.path[n.wp];
      const gx = tx + 0.5, gy = ty + 0.5;
      const ddx = gx - n.x, ddy = gy - n.y, d = Math.hypot(ddx, ddy);
      if (d < 0.08) { n.wp = (n.wp + 1) % n.path.length; n.wait = 0.6 + Math.random(); }
      else { const s = speed * dt; n.x += (ddx / d) * s; n.y += (ddy / d) * s; }
    };
    for (const n of npcs.current) stepNpc(n, 2.2);
    for (const n of workerNpcs.current) stepNpc(n, 1.8);

    const mult = SPEED[speedRef.current];
    if (mult > 0) { clock.current += (dt / DAY_REAL_SEC) * mult; if (clock.current >= 1) { clock.current -= 1; actions.nextDay(); } }

    zoomCur.current += (zoomRef.current - zoomCur.current) * Math.min(1, dt * 8);
    const tileSize = WTILE * zoomCur.current;
    const { w, h } = size.current;
    let tcx = p.x * tileSize - w / 2, tcy = p.y * tileSize - h / 2;
    tcx = Math.max(0, Math.min(Math.max(0, M.W * tileSize - w), tcx));
    tcy = Math.max(0, Math.min(Math.max(0, M.H * tileSize - h), tcy));
    if (M.W * tileSize < w) tcx = (M.W * tileSize - w) / 2;
    if (M.H * tileSize < h) tcy = (M.H * tileSize - h) / 2;
    const ease = Math.min(1, dt * 7);
    cam.current.x += (tcx - cam.current.x) * ease;
    cam.current.y += (tcy - cam.current.y) * ease;

    if (!update._t || now - update._t > 250) {
      update._t = now;
      setHud({ clock: clockString(clock.current), night: isNight(clock.current) });
    }
  }

  function buildTerrainCache(M, pal) {
    const c = document.createElement('canvas');
    c.width = M.W * WTILE; c.height = M.H * WTILE;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    for (let ty = 0; ty < M.H; ty++) for (let tx = 0; tx < M.W; tx++)
      drawTile(cx, M.TERRAIN[ty][tx], tx, ty, tx * WTILE, ty * WTILE, WTILE, pal);
    return c;
  }

  function render() {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    const st = stateRef.current;
    const M = getMap();
    const pal = paletteFor(seasonRef.current);
    const tileSize = WTILE * zoomCur.current;
    const camX = cam.current.x, camY = cam.current.y;
    const x0 = Math.max(0, Math.floor(camX / tileSize)), y0 = Math.max(0, Math.floor(camY / tileSize));
    const x1 = Math.min(M.W, Math.ceil((camX + w) / tileSize)), y1 = Math.min(M.H, Math.ceil((camY + h) / tileSize));
    const now = performance.now();
    const wind = now / 700;
    const night = isNight(clock.current);

    const ck = `${M.id}:${seasonRef.current}`;
    if (!terrainCache.current || cacheKey.current !== ck) { terrainCache.current = buildTerrainCache(M, pal); cacheKey.current = ck; }
    ctx.drawImage(terrainCache.current, -camX, -camY, M.W * tileSize, M.H * tileSize);

    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++)
      if (M.TERRAIN[ty][tx] === T.WATER) drawWaterShimmer(ctx, tx * tileSize - camX, ty * tileSize - camY, tileSize, pal, now);

    const rm = removedSet();
    const sprites = [];
    for (const o of M.OBJECTS) {
      if (o.x < x0 - 1 || o.x > x1 || o.y < y0 - 1 || o.y > y1) continue;
      const key = `${o.x},${o.y}`;
      if (rm.has(key)) continue;
      const ox = o.x * tileSize - camX, oy = o.y * tileSize - camY;
      const done = hits.current.get(key) || 0;
      const shaking = hitFx.current && hitFx.current.key === key && now - hitFx.current.t < 180;
      const jit = shaking ? Math.sin(now / 16) * 2.5 : 0;
      sprites.push({
        y: o.y + 0.9, fn: () => {
          drawObject(ctx, o, ox + jit, oy, tileSize, pal, wind);
          if (done > 0 && (o.type === 'tree' || o.type === 'rock'))
            drawNodeHits(ctx, ox, oy, tileSize, done, o.type === 'tree' ? TREE_HITS : ROCK_HITS);
        },
      });
    }
    if (M.FARM) {
      const fcols = M.FARM.cols, fmax = M.FARM.cols * M.FARM.rows;
      for (let i = 0; i < st.farm.length; i++) {
        const plot = st.farm[i]; if (!plot) continue;
        const px = M.FARM.x + (i % fcols), py = M.FARM.y + Math.floor(i / fcols);
        const crop = CROPS[plot.cropId];
        const ratio = Math.min(1, (st.day - plot.plantedDay) / crop.growthDays);
        sprites.push({ y: py + 0.95, fn: () => drawCrop(ctx, plot.cropId, ratio, ratio >= 1, px * tileSize - camX, py * tileSize - camY, tileSize) });
      }
      // 미개간(잠긴) 칸: 어둡게 + 🔒 (개간하면 사용 가능)
      for (let i = st.farm.length; i < fmax; i++) {
        const px = M.FARM.x + (i % fcols), py = M.FARM.y + Math.floor(i / fcols);
        sprites.push({ y: py + 0.5, fn: () => {
          const dx = px * tileSize - camX, dy = py * tileSize - camY;
          ctx.fillStyle = 'rgba(20,16,10,0.42)'; ctx.fillRect(dx, dy, tileSize, tileSize);
          ctx.font = `${Math.round(tileSize * 0.42)}px sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('🔒', dx + tileSize / 2, dy + tileSize * 0.66); ctx.textAlign = 'left';
        } });
      }
    }

    // 가축 방목장: 울타리 + 보유 가축 표시
    if (M.PASTURE) {
      const P = M.PASTURE;
      // 울타리 외곽 + 라벨 (동물보다 뒤에 그림)
      sprites.push({ y: P.y - 0.1, fn: () => {
        const dx = P.x * tileSize - camX, dy = P.y * tileSize - camY;
        const w2 = P.w * tileSize, h2 = P.h * tileSize;
        ctx.strokeStyle = '#9c6b3a'; ctx.lineWidth = Math.max(2, tileSize * 0.09);
        ctx.setLineDash([tileSize * 0.5, tileSize * 0.28]);
        ctx.strokeRect(dx + 2, dy + 2, w2 - 4, h2 - 4);
        ctx.setLineDash([]);
        ctx.font = `bold ${Math.round(tileSize * 0.4)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(20,26,38,0.85)';
        const lbl = '🐄 가축장'; const lw = ctx.measureText(lbl).width + 10;
        ctx.fillRect(dx + w2 / 2 - lw / 2, dy - tileSize * 0.5, lw, tileSize * 0.42);
        ctx.fillStyle = '#ffe9b0'; ctx.fillText(lbl, dx + w2 / 2, dy - tileSize * 0.18);
        ctx.textAlign = 'left';
      } });
      // 보유 가축을 펜 안에 배치 (펜 용량만큼만 표시)
      const cap = P.w * P.h;
      let slot = 0;
      for (const a of ANIMAL_LIST) {
        const cnt = (st.livestock[a.id] && st.livestock[a.id].count) || 0;
        for (let k = 0; k < cnt && slot < cap; k++, slot++) {
          const ax = P.x + (slot % P.w) + 0.5;
          const ay = P.y + Math.floor(slot / P.w) + 0.55;
          const ic = a.icon;
          sprites.push({ y: ay, fn: () => {
            const bob = Math.sin(now / 380 + slot * 1.7) * tileSize * 0.05;
            ctx.font = `${Math.round(tileSize * 0.5)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(ic, ax * tileSize - camX, ay * tileSize - camY + bob);
            ctx.textAlign = 'left';
          } });
        }
      }
    }
    for (const pl of st.placed) {
      if ((pl.map || 'village') !== M.id) continue;
      sprites.push({ y: pl.y + 0.95, fn: () => drawPlaceable(ctx, pl.type, pl.x * tileSize - camX, pl.y * tileSize - camY, tileSize, night) });
    }
    for (const b of M.BUILDINGS) {
      sprites.push({ y: b.y + b.h, fn: () => drawBuilding(ctx, b, b.x * tileSize - camX, b.y * tileSize - camY, tileSize, night) });
    }
    const nf = Math.floor(now / 220) % 2;
    for (const n of npcs.current) sprites.push({ y: n.y, fn: () => drawNPC(ctx, n.x * tileSize - camX - tileSize / 2, n.y * tileSize - camY - tileSize / 2, tileSize, n.color, nf) });
    for (const n of workerNpcs.current) sprites.push({
      y: n.y, fn: () => {
        const sx = n.x * tileSize - camX, sy = n.y * tileSize - camY;
        drawNPC(ctx, sx - tileSize / 2, sy - tileSize / 2, tileSize, n.color, nf);
        // 머리 위 직업 아이콘 + 일하는 표시(작업 중엔 위아래로 까딱, 휴식 중엔 💤)
        const working = !n.resting;
        const swing = working ? Math.sin(now / 120 + n.x) * tileSize * 0.06 : 0;
        ctx.font = `${Math.round(tileSize * 0.42)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.resting ? '💤' : n.icon, sx, sy - tileSize * 0.62 + swing);
        ctx.textAlign = 'left';
      },
    });
    const p = player.current;
    sprites.push({ y: p.y, fn: () => drawPlayer(ctx, p.x * tileSize - camX - tileSize / 2, p.y * tileSize - camY - tileSize / 2, tileSize, p.facing, p.frame) });

    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.fn();

    // 출구 표시 (노란 칸 + 화살표 + 표지판 라벨)
    const labeled = new Set();
    ctx.textAlign = 'center';
    for (const ex of M.EXITS) {
      const exx = ex.x * tileSize - camX, exy = ex.y * tileSize - camY;
      ctx.fillStyle = 'rgba(255,220,80,0.22)'; ctx.fillRect(exx, exy, tileSize, tileSize);
      ctx.strokeStyle = 'rgba(255,220,80,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(exx, exy, tileSize, tileSize);
      ctx.fillStyle = 'rgba(255,220,80,0.95)'; ctx.font = `bold ${Math.round(tileSize * 0.5)}px sans-serif`;
      ctx.fillText('➜', exx + tileSize / 2, exy + tileSize * 0.68);
      if (!labeled.has(ex.to)) {
        labeled.add(ex.to);
        const lx = exx + tileSize / 2, ly = exy - 4;
        const label = `🪧 ${ex.label || '이동'}`;
        ctx.font = 'bold 12px sans-serif';
        const w2 = ctx.measureText(label).width + 12;
        ctx.fillStyle = 'rgba(20,26,38,0.92)'; ctx.fillRect(lx - w2 / 2, ly - 18, w2, 18);
        ctx.strokeStyle = 'rgba(255,220,80,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(lx - w2 / 2, ly - 18, w2, 18);
        ctx.fillStyle = '#ffe27a'; ctx.fillText(label, lx, ly - 5);
      }
    }
    ctx.textAlign = 'left';

    if (placeRef.current) {
      const tx = Math.floor(p.x) + (p.facing === 'left' ? -1 : p.facing === 'right' ? 1 : 0);
      const ty = Math.floor(p.y) + (p.facing === 'up' ? -1 : p.facing === 'down' ? 1 : 0);
      const def = PLACEABLES[placeRef.current];
      const c = def.cost || {};
      const afford = st.money >= (c.gold || 0) && st.wood >= (c.wood || 0) && st.stone >= (c.stone || 0);
      const unlocked = (st.villageLevel || 1) >= (def.unlock || 1);
      const free = M.isWalkable(tx, ty, rm, placedSolid()) && !M.buildingHitAt(tx, ty) && M.terrainAt(tx, ty) !== T.SOIL;
      const ok = afford && unlocked && free;
      ctx.fillStyle = ok ? 'rgba(90,220,110,0.35)' : 'rgba(230,80,70,0.35)';
      ctx.fillRect(tx * tileSize - camX, ty * tileSize - camY, tileSize, tileSize);
      ctx.strokeStyle = ok ? 'rgba(120,255,140,0.95)' : 'rgba(255,90,80,0.95)'; ctx.lineWidth = 2;
      ctx.strokeRect(tx * tileSize - camX, ty * tileSize - camY, tileSize, tileSize);
    }

    const ov = ambientOverlay(clock.current);
    if (ov.alpha > 0.002) { ctx.fillStyle = ov.color; ctx.fillRect(0, 0, w, h); }
    if (night) {
      ctx.globalCompositeOperation = 'lighter';
      for (const pl of st.placed) if ((pl.map || 'village') === M.id && PLACEABLES[pl.type]?.light) drawLampGlow(ctx, pl.x * tileSize - camX, pl.y * tileSize - camY, tileSize);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (showMapRef.current && miniRef.current && terrainCache.current) {
      const mc = miniRef.current, mw = mc.width, mh = mc.height, mctx = mc.getContext('2d');
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(terrainCache.current, 0, 0, mw, mh);
      const sxr = mw / M.W, syr = mh / M.H;
      mctx.fillStyle = '#b5713e';
      for (const b of M.BUILDINGS) mctx.fillRect(b.x * sxr, b.y * syr, Math.max(2, b.w * sxr), Math.max(2, b.h * syr));
      mctx.fillStyle = '#ffd24a'; for (const ex of M.EXITS) mctx.fillRect(ex.x * sxr - 1, ex.y * syr - 1, 3, 3);
      mctx.fillStyle = '#7da7ff';
      for (const n of npcs.current) mctx.fillRect(n.x * sxr - 1, n.y * syr - 1, 2, 2);
      for (const n of workerNpcs.current) mctx.fillRect(n.x * sxr - 1, n.y * syr - 1, 2, 2);
      mctx.fillStyle = '#ff3b3b'; mctx.fillRect(p.x * sxr - 2, p.y * syr - 2, 4, 4);
      mctx.strokeStyle = 'rgba(255,255,255,0.7)'; mctx.lineWidth = 1;
      mctx.strokeRect((camX / tileSize) * sxr, (camY / tileSize) * syr, (w / tileSize) * sxr, (h / tileSize) * syr);
    }
  }

  const joyStart = useCallback(() => { joy.current.active = true; }, []);
  const joyMove = useCallback((dx, dy) => { joy.current.dx = dx; joy.current.dy = dy; }, []);
  const joyEnd = useCallback(() => { joy.current.active = false; joy.current.dx = 0; joy.current.dy = 0; }, []);

  const onCanvasClick = useCallback((e) => {
    if (modalRef.current) return;
    const cv = canvasRef.current; const rect = cv.getBoundingClientRect();
    const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;
    const tileSize = WTILE * zoomCur.current;
    interact(Math.floor((cssX + cam.current.x) / tileSize), Math.floor((cssY + cam.current.y) / tileSize));
  }, [interact]);

  return {
    canvasRef, wrapRef, onCanvasClick,
    tool, setTool, selectedCrop, setSelectedCrop,
    placeType, setPlaceType,
    zoom, setZoom, speedId, setSpeedId,
    activeBuilding, setActiveBuilding,
    hud, showMap, setShowMap, miniRef,
    talkNpc, setTalkNpc, run, setRun,
    mapId, mapName: (MAP_META[mapId] || {}).name || mapId, mapIcon: (MAP_META[mapId] || {}).icon || '🗺️',
    travelTo,
    joy: { joyStart, joyMove, joyEnd },
    interactFront,
  };
}
