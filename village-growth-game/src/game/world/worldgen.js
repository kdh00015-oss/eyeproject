// 월드 생성: 여러 맵(마을/들판)을 지원하는 팩토리 구조
//  - village(마을): 건물·농장·상점 중심의 거점
//  - wild(들판/숲): 나무·광물·강이 풍부한 채집/탐험 지역
//  맵 사이는 가장자리 출구(EXIT)로 이동한다.

export const WTILE = 32;

// 지형 코드
export const T = { GRASS: 0, GRASS2: 1, PATH: 2, WATER: 3, SAND: 4, SOIL: 5, FLOWERBED: 6 };
// 자연물 코드
export const OBJ = { TREE: 'tree', ROCK: 'rock', BUSH: 'bush', FLOWER: 'flower', MUSHROOM: 'mushroom', LOG: 'log', GRASS: 'grasstuft' };
export const SOFT_OBJ = new Set([OBJ.FLOWER, OBJ.MUSHROOM, OBJ.LOG, OBJ.GRASS]);

// 건설 모드로 배치 가능한 건물/구조물
//  cost: 골드/목재/돌 | effect: 마을에 주는 효과 | unlock: 필요한 마을 레벨
export const PLACEABLES = {
  house: { id: 'house', name: '집', icon: '🏠', cost: { gold: 30, wood: 8, stone: 4 }, solid: true, unlock: 1, effect: { maxPop: 4 }, desc: '최대 인구 +4' },
  warehouse: { id: 'warehouse', name: '창고', icon: '🏚️', cost: { gold: 40, wood: 10, stone: 6 }, solid: true, unlock: 1, effect: { storage: 50, hygiene: 2 }, desc: '저장 +50' },
  well: { id: 'well', name: '우물', icon: '⛲', cost: { gold: 20, wood: 4, stone: 8 }, solid: true, unlock: 1, effect: { hygiene: 8 }, desc: '위생 +8' },
  flowerpot: { id: 'flowerpot', name: '화단', icon: '🌷', cost: { gold: 10, wood: 1, stone: 0 }, solid: false, unlock: 1, effect: { culture: 4 }, desc: '문화 +4' },
  lamp: { id: 'lamp', name: '가로등', icon: '🏮', cost: { gold: 15, wood: 2, stone: 1 }, solid: false, light: true, unlock: 2, effect: { culture: 5, safety: 4 }, desc: '문화/안전 +, 야간 조명' },
  fence: { id: 'fence', name: '울타리', icon: '🪵', cost: { gold: 5, wood: 2, stone: 0 }, solid: true, unlock: 1, effect: { safety: 1 }, desc: '안전 +1' },
  school: { id: 'school', name: '학교', icon: '🏫', cost: { gold: 120, wood: 18, stone: 10 }, solid: true, unlock: 2, effect: { education: 18, culture: 4 }, desc: '교육 +18' },
  hospital: { id: 'hospital', name: '병원', icon: '🏥', cost: { gold: 160, wood: 16, stone: 16 }, solid: true, unlock: 3, effect: { hygiene: 16, safety: 8 }, desc: '위생·안전 +' },
  watchtower: { id: 'watchtower', name: '경비탑', icon: '🗼', cost: { gold: 100, wood: 14, stone: 12 }, solid: true, unlock: 3, effect: { safety: 18 }, desc: '안전 +18' },
};

// 배치물들의 효과 합산
export function placedEffects(placed) {
  const sum = { maxPop: 0, storage: 0, hygiene: 0, culture: 0, education: 0, safety: 0 };
  for (const p of placed) {
    const def = PLACEABLES[p.type];
    if (!def || !def.effect) continue;
    for (const k of Object.keys(sum)) sum[k] += def.effect[k] || 0;
  }
  return sum;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function inRect(x, y, r) { return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }

// 맵 객체 + 헬퍼 생성
function makeMap(raw) {
  const { id, W, H, terrain, objects, buildings, npcs, farm, exits, playerStart } = raw;

  const BUILDING_SOLID = new Set();
  const DOORS = new Map();
  for (const b of buildings) {
    for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) BUILDING_SOLID.add(`${b.x + dx},${b.y + dy}`);
    DOORS.set(`${b.door.x},${b.door.y}`, b);
  }
  const SOLID_OBJ = new Map();
  for (const o of objects) if (!SOFT_OBJ.has(o.type)) SOLID_OBJ.set(`${o.x},${o.y}`, o);

  const terrainAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? T.WATER : terrain[y][x]);

  return {
    id, W, H, TERRAIN: terrain, OBJECTS: objects, BUILDINGS: buildings, NPCS: npcs,
    FARM: farm, EXITS: exits, PLAYER_START: playerStart,
    terrainAt,
    objectAt: (x, y) => SOLID_OBJ.get(`${x},${y}`) || null,
    doorAt: (x, y) => DOORS.get(`${x},${y}`) || null,
    buildingHitAt: (x, y) => {
      for (const b of buildings) { if (inRect(x, y, b)) return b; if (b.door.x === x && b.door.y === y) return b; }
      return null;
    },
    exitAt: (x, y) => exits.find((e) => e.x === x && e.y === y) || null,
    plotIndexAt: (x, y) => {
      if (!farm || terrainAt(x, y) !== T.SOIL) return -1;
      return (y - farm.y) * farm.cols + (x - farm.x);
    },
    isWalkable: (x, y, removed, placedSolid) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      if (terrainAt(x, y) === T.WATER) return false;
      if (BUILDING_SOLID.has(`${x},${y}`)) return false;
      const key = `${x},${y}`;
      const o = SOLID_OBJ.get(key);
      if (o && !(removed && removed.has(key))) return false;
      if (placedSolid && placedSolid.has(key)) return false;
      return true;
    },
  };
}

// ---------------- 마을(village) ----------------
function buildVillage() {
  const W = 44, H = 32;
  const FARM = { x: 5, y: 20, cols: 4, rows: 4 };
  const rnd = mulberry32(1337);
  const inLake = (x, y) => ((x - 20.5) ** 2) / 110 + ((y - 4.5) ** 2) / 16 < 1;
  const t = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      let c = T.GRASS;
      if (inLake(x, y)) c = T.WATER;
      else if (inLake(x, y + 1) || inLake(x + 1, y) || inLake(x - 1, y) || inLake(x, y - 1)) c = T.SAND;
      else if (rnd() < 0.12) c = T.GRASS2;
      row.push(c);
    }
    t.push(row);
  }
  for (let x = 4; x <= 42; x++) { t[16][x] = T.PATH; t[17][x] = T.PATH; } // 2칸 폭 메인 도로(건물에 안 걸리게)
  for (let y = 9; y <= 24; y++) t[y][21] = T.PATH;
  for (let y = 16; y <= 20; y++) { t[y][28] = T.PATH; t[y][34] = T.PATH; }
  for (let y = 9; y <= 16; y++) { t[y][9] = T.PATH; t[y][32] = T.PATH; }
  for (let y = 16; y <= 24; y++) t[y][14] = T.PATH;
  for (let j = 0; j < FARM.rows; j++) for (let i = 0; i < FARM.cols; i++) t[FARM.y + j][FARM.x + i] = T.SOIL;
  for (const [fx, fy] of [[24, 20], [17, 19], [37, 22], [11, 18]]) if (t[fy][fx] === T.GRASS) t[fy][fx] = T.FLOWERBED;

  const buildings = [
    { id: 'townhall', name: '마을회관', panel: 'build', x: 20, y: 13, w: 3, h: 3, door: { x: 21, y: 16 } },
    { id: 'labor', name: '고용소', panel: 'workers', x: 24, y: 13, w: 2, h: 2, door: { x: 24, y: 16 } },
    { id: 'market', name: '시장', panel: 'market', x: 27, y: 14, w: 3, h: 2, door: { x: 28, y: 16 } },
    { id: 'dock', name: '낚시터', panel: 'fishing', x: 9, y: 7, w: 2, h: 2, door: { x: 9, y: 9 } },
    { id: 'port', name: '항구', panel: 'trade', x: 31, y: 7, w: 3, h: 2, door: { x: 32, y: 9 } },
    { id: 'barn', name: '축사', panel: 'livestock', x: 13, y: 22, w: 3, h: 2, door: { x: 14, y: 24 } },
    { id: 'lab', name: '연구소', panel: 'research', x: 34, y: 18, w: 2, h: 2, door: { x: 34, y: 20 } },
  ];
  const BSOLID = new Set(); const DOOR = new Set();
  for (const b of buildings) { for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) BSOLID.add(`${b.x + dx},${b.y + dy}`); DOOR.add(`${b.door.x},${b.door.y}`); }

  const r2 = mulberry32(99);
  const objects = []; const occ = new Set();
  const place = (type, soft) => {
    const x = Math.floor(r2() * W), y = Math.floor(r2() * H), key = `${x},${y}`;
    const c = t[y][x];
    if (c === T.WATER || c === T.PATH || c === T.SOIL) return;
    if (!soft && occ.has(key)) return;
    if (!soft && y >= 15 && y <= 17) return; // 메인 도로 회랑 비움(통행)
    if (BSOLID.has(key) || DOOR.has(key)) return;
    if (inRect(x, y, { x: FARM.x - 1, y: FARM.y - 1, w: FARM.cols + 2, h: FARM.rows + 2 })) return;
    occ.add(key); objects.push({ type, x, y, seed: Math.floor(r2() * 1000) });
  };
  for (let i = 0; i < 45; i++) place(OBJ.TREE);
  for (let i = 0; i < 14; i++) place(OBJ.ROCK);
  for (let i = 0; i < 24; i++) place(OBJ.BUSH);
  for (let i = 0; i < 40; i++) place(OBJ.FLOWER, true);
  for (let i = 0; i < 18; i++) place(OBJ.MUSHROOM, true);
  for (let i = 0; i < 120; i++) place(OBJ.GRASS, true);

  const npcs = [
    { id: 'v1', name: '엘라', color: '#e06a8a', role: 'merchant', path: [[21, 18], [28, 18], [28, 14], [21, 12]],
      lines: ['오늘은 장이 잘 섰어요. 필요한 거 있으면 말해요!', '신선한 채소가 들어왔답니다.', '많이 팔면 값이 잠깐 떨어지니 조금씩 파는 것도 방법이에요.'] },
    { id: 'v2', name: '톰', color: '#6a8ae0', role: 'villager', path: [[14, 18], [14, 23], [9, 16], [21, 16]],
      lines: ['요즘 들판 너머에 광물이 많다더군요.', '겨울엔 작물이 비싸게 팔려요. 미리 길러두세요.', '낚시는 항구를 지으면 바다까지 갈 수 있어요.'] },
    { id: 'v3', name: '미라', color: '#e0b86a', role: 'villager', path: [[34, 19], [32, 16], [28, 16], [34, 16]],
      lines: ['연구소를 지으면 생산력이 확 올라요.', '일꾼을 고용하면 알아서 일해준답니다.', '마을이 커지면 직위도 올라가요!'] },
  ];
  // 동쪽 관문(3칸) → 들판
  const exits = [];
  for (let y = 15; y <= 17; y++) { t[y][42] = T.PATH; t[y][41] = T.PATH; exits.push({ x: 42, y, to: 'wild', at: { x: 3, y: 15 }, label: '들판으로' }); }
  // 서쪽 관문(3칸) → 도시
  for (let x = 1; x <= 4; x++) { t[16][x] = T.PATH; t[17][x] = T.PATH; }
  for (let y = 15; y <= 17; y++) { t[y][1] = T.PATH; t[y][2] = T.PATH; exits.push({ x: 1, y, to: 'town', at: { x: 33, y: 13 }, label: '도시로' }); }

  return makeMap({ id: 'village', W, H, terrain: t, objects, buildings, npcs, farm: FARM, exits, playerStart: { x: 21, y: 18 } });
}

// ---------------- 들판/숲(wild) ----------------
function buildWild() {
  const W = 40, H = 30;
  const rnd = mulberry32(7777);
  const t = [];
  // 구불구불한 강(세로)
  const riverX = (y) => 26 + Math.round(Math.sin(y * 0.4) * 3);
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      let c = T.GRASS;
      const rx = riverX(y);
      if (Math.abs(x - rx) <= 1) c = T.WATER;
      else if (Math.abs(x - rx) === 2) c = T.SAND;
      else if (rnd() < 0.14) c = T.GRASS2;
      row.push(c);
    }
    t.push(row);
  }
  // 입구 길(서쪽, 3칸 관문)
  for (let y = 14; y <= 16; y++) for (let x = 0; x <= 6; x++) t[y][x] = T.PATH;
  // 동서로 가로지르는 숲길(강 위 다리 포함) — 통행로
  for (let x = 0; x < W; x++) t[15][x] = T.PATH;

  const r2 = mulberry32(424242);
  const objects = []; const occ = new Set();
  const place = (type, soft) => {
    const x = Math.floor(r2() * W), y = Math.floor(r2() * H), key = `${x},${y}`;
    const c = t[y][x];
    if (c === T.WATER || c === T.PATH) return;
    if (!soft && occ.has(key)) return;
    if (!soft && y >= 14 && y <= 16) return; // 숲길 회랑 비움(통행)
    occ.add(key); objects.push({ type, x, y, seed: Math.floor(r2() * 1000) });
  };
  // 채집 풍부: 나무·바위 다수
  for (let i = 0; i < 220; i++) place(OBJ.TREE);
  for (let i = 0; i < 70; i++) place(OBJ.ROCK);
  for (let i = 0; i < 40; i++) place(OBJ.BUSH);
  for (let i = 0; i < 50; i++) place(OBJ.FLOWER, true);
  for (let i = 0; i < 40; i++) place(OBJ.MUSHROOM, true);
  for (let i = 0; i < 30; i++) place(OBJ.LOG, true);
  for (let i = 0; i < 160; i++) place(OBJ.GRASS, true);

  const npcs = [
    { id: 'w1', name: '나그네', color: '#9a8a6a', role: 'villager', path: [[8, 12], [14, 18], [20, 10], [10, 8]],
      lines: ['이 숲은 목재와 사냥감이 많지요.', '더 동쪽으로 가면 험한 산이 나와요. 광물이 풍부하답니다.', '나무는 몇 번 내리쳐야 쓰러져요. 끈기가 필요하죠.'] },
  ];
  // 서쪽 관문(3칸) → 마을
  const exits = [];
  for (let y = 14; y <= 16; y++) exits.push({ x: 0, y, to: 'village', at: { x: 40, y: 16 }, label: '마을로' });
  // 동쪽 관문(3칸) → 산
  for (let y = 14; y <= 16; y++) { t[y][W - 1] = T.PATH; t[y][W - 2] = T.PATH; exits.push({ x: W - 1, y, to: 'mountain', at: { x: 2, y: 14 }, label: '산으로' }); }

  return makeMap({ id: 'wild', W, H, terrain: t, objects, buildings: [], npcs, farm: null, exits, playerStart: { x: 3, y: 15 } });
}

// ---------------- 도시(town): 큰 시장·교역 거점 ----------------
function buildTown() {
  const W = 36, H = 26;
  const rnd = mulberry32(2024);
  const t = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) row.push(rnd() < 0.1 ? T.GRASS2 : T.GRASS);
    t.push(row);
  }
  // 가로 대로(2칸) + 세로 골목 + 중앙 광장
  for (let x = 1; x <= W - 1; x++) { t[13][x] = T.PATH; t[14][x] = T.PATH; }
  for (const gx of [6, 13, 22, 29]) for (let y = 7; y <= 19; y++) t[y][gx] = T.PATH;
  for (let y = 15; y <= 19; y++) for (let x = 15; x <= 21; x++) t[y][x] = T.PATH; // 남쪽 광장
  for (const [fx, fy] of [[16, 16], [20, 16], [18, 18]]) t[fy][fx] = T.FLOWERBED;

  const buildings = [
    { id: 'market', name: '대시장', panel: 'market', x: 5, y: 10, w: 3, h: 3, door: { x: 6, y: 13 } },
    { id: 'trade', name: '무역소', panel: 'trade', x: 12, y: 10, w: 3, h: 3, door: { x: 13, y: 13 } },
    { id: 'labor', name: '인력시장', panel: 'workers', x: 21, y: 10, w: 3, h: 3, door: { x: 22, y: 13 } },
    { id: 'lab', name: '연구소', panel: 'research', x: 28, y: 10, w: 3, h: 3, door: { x: 29, y: 13 } },
  ];
  const BSOLID = new Set(); const DOOR = new Set();
  for (const b of buildings) { for (let dy = 0; dy < b.h; dy++) for (let dx = 0; dx < b.w; dx++) BSOLID.add(`${b.x + dx},${b.y + dy}`); DOOR.add(`${b.door.x},${b.door.y}`); }

  const r2 = mulberry32(31337);
  const objects = []; const occ = new Set();
  const place = (type, soft) => {
    const x = Math.floor(r2() * W), y = Math.floor(r2() * H), key = `${x},${y}`;
    if (t[y][x] !== T.GRASS && t[y][x] !== T.GRASS2) return;
    if (!soft && occ.has(key)) return;
    if (!soft && y >= 12 && y <= 15) return; // 대로 비움
    if (BSOLID.has(key) || DOOR.has(key)) return;
    occ.add(key); objects.push({ type, x, y, seed: Math.floor(r2() * 1000) });
  };
  for (let i = 0; i < 18; i++) place(OBJ.TREE);
  for (let i = 0; i < 40; i++) place(OBJ.FLOWER, true);
  for (let i = 0; i < 80; i++) place(OBJ.GRASS, true);

  const npcs = [
    { id: 't1', name: '상단주 곤잘로', color: '#d98b4a', role: 'merchant', path: [[8, 16], [14, 16], [20, 16], [14, 12]],
      lines: ['도시의 대시장에 오신 걸 환영합니다!', '여기선 무엇이든 사고 팔 수 있어요.', '희귀한 물건은 값을 후하게 쳐드리죠.'] },
    { id: 't2', name: '음유시인', color: '#8a6ad0', role: 'villager', path: [[18, 18], [22, 17], [16, 17], [18, 16]],
      lines: ['노래 한 곡 들려드릴까요? ♪', '제국을 세운 영웅의 이야기를 아시나요?', '도시는 결코 잠들지 않는답니다.'] },
    { id: 't3', name: '경비병', color: '#5a7fb0', role: 'villager', path: [[33, 14], [29, 14], [29, 10], [33, 13]],
      lines: ['도시는 제가 지킵니다. 안심하세요.', '동쪽 마을에서 오셨군요. 환영합니다.', '말썽만 일으키지 않으면 됩니다.'] },
  ];
  // 동쪽 관문(3칸) → 마을
  const exits = [];
  for (let y = 12; y <= 14; y++) { t[y][W - 1] = T.PATH; t[y][W - 2] = T.PATH; exits.push({ x: W - 1, y, to: 'village', at: { x: 3, y: 16 }, label: '마을로' }); }

  return makeMap({ id: 'town', W, H, terrain: t, objects, buildings, npcs, farm: null, exits, playerStart: { x: 18, y: 14 } });
}

// ---------------- 산/광산(mountain): 채광·채집이 풍부한 험지 ----------------
function buildMountain() {
  const W = 38, H = 28;
  const rnd = mulberry32(5150);
  const t = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      let c = rnd() < 0.18 ? T.GRASS2 : T.GRASS;
      if (rnd() < 0.06) c = T.SAND; // 자갈밭 느낌
      row.push(c);
    }
    t.push(row);
  }
  // 입구 길(서쪽) + 산길(가로)
  for (let y = 13; y <= 15; y++) for (let x = 0; x <= 5; x++) t[y][x] = T.PATH;
  for (let x = 0; x < W; x++) t[14][x] = T.PATH;
  for (let y = 8; y <= 20; y++) t[y][20] = T.PATH;

  const r2 = mulberry32(909090);
  const objects = []; const occ = new Set();
  const place = (type, soft) => {
    const x = Math.floor(r2() * W), y = Math.floor(r2() * H), key = `${x},${y}`;
    if (t[y][x] === T.PATH) return;
    if (!soft && occ.has(key)) return;
    if (!soft && y >= 13 && y <= 15) return; // 산길 비움
    occ.add(key); objects.push({ type, x, y, seed: Math.floor(r2() * 1000) });
  };
  // 바위가 매우 풍부(채광 명소) + 약간의 나무
  for (let i = 0; i < 200; i++) place(OBJ.ROCK);
  for (let i = 0; i < 80; i++) place(OBJ.TREE);
  for (let i = 0; i < 40; i++) place(OBJ.BUSH);
  for (let i = 0; i < 30; i++) place(OBJ.MUSHROOM, true);
  for (let i = 0; i < 120; i++) place(OBJ.GRASS, true);

  const npcs = [
    { id: 'm1', name: '늙은 광부', color: '#9aa0a6', role: 'villager', path: [[8, 12], [12, 16], [18, 12], [10, 10]],
      lines: ['여긴 바위투성이라 돌 캐기엔 최고지.', '곡괭이를 강화하면 더 많이 캘 수 있다네.', '깊은 곳엔 더 귀한 광물이 있다는 소문이…'] },
  ];
  // 서쪽 관문(3칸) → 들판
  const exits = [];
  for (let y = 13; y <= 15; y++) exits.push({ x: 0, y, to: 'wild', at: { x: 37, y: 15 }, label: '들판으로' });

  return makeMap({ id: 'mountain', W, H, terrain: t, objects, buildings: [], npcs, farm: null, exits, playerStart: { x: 2, y: 14 } });
}

export const MAPS = { village: buildVillage(), wild: buildWild(), town: buildTown(), mountain: buildMountain() };

// 전체(월드) 지도용 메타데이터 — 각 지역의 이름/아이콘/설명 + 연결 관계
export const MAP_META = {
  town: { id: 'town', name: '도시', icon: '🏙️', desc: '대시장·무역소가 있는 번화한 거점', dir: '서쪽' },
  village: { id: 'village', name: '마을', icon: '🏡', desc: '건물·농장·상점이 있는 생활 거점', dir: '중앙' },
  wild: { id: 'wild', name: '들판 · 숲', icon: '🌲', desc: '나무·사냥감이 풍부한 채집/탐험지', dir: '동쪽' },
  mountain: { id: 'mountain', name: '산 · 광산', icon: '⛰️', desc: '바위·광물이 가득한 채광 명소', dir: '동쪽 끝' },
};
// 지역 간 연결 (좌→우 배치 순서이기도 함): 도시 ↔ 마을 ↔ 들판 ↔ 산
export const MAP_ORDER = ['town', 'village', 'wild', 'mountain'];
export const MAP_LINKS = [['town', 'village'], ['village', 'wild'], ['wild', 'mountain']];
