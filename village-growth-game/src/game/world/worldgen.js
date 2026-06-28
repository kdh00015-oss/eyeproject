// 월드 생성: 타일 지형 + 자연물(나무/바위/꽃) + 고정 건물 + NPC 경로
//  결정적(seed 고정)으로 생성되어 새로고침해도 동일한 맵이 나온다.

export const WTILE = 32; // 논리 타일 크기(px)
export const WORLD_W = 44;
export const WORLD_H = 32;

// 지형 코드
export const T = {
  GRASS: 0,
  GRASS2: 1,
  PATH: 2,
  WATER: 3,
  SAND: 4,
  SOIL: 5,
  FLOWERBED: 6,
};

// 자연물 코드
export const OBJ = {
  TREE: 'tree',
  ROCK: 'rock',
  BUSH: 'bush',
  FLOWER: 'flower',
};

// 농장 밭 영역 (state.farm 인덱스와 매핑)
export const FARM = { x: 5, y: 20, cols: 4, rows: 4 };

// 고정(진입 가능) 건물 — 문(door)으로 들어가면 패널이 열린다.
export const BUILDINGS = [
  { id: 'townhall', name: '마을회관', panel: 'build', x: 20, y: 13, w: 3, h: 3, door: { x: 21, y: 16 } },
  { id: 'market', name: '시장', panel: 'market', x: 27, y: 14, w: 3, h: 2, door: { x: 28, y: 16 } },
  { id: 'dock', name: '낚시터', panel: 'fishing', x: 9, y: 7, w: 2, h: 2, door: { x: 9, y: 9 } },
  { id: 'port', name: '항구', panel: 'trade', x: 31, y: 7, w: 3, h: 2, door: { x: 32, y: 9 } },
  { id: 'barn', name: '축사', panel: 'livestock', x: 13, y: 22, w: 3, h: 2, door: { x: 14, y: 24 } },
  { id: 'lab', name: '연구소', panel: 'research', x: 34, y: 18, w: 2, h: 2, door: { x: 34, y: 20 } },
];

// 간단한 결정적 난수
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// 호수(원형) 포함 여부
function inLake(x, y) {
  const dx = x - 20.5, dy = y - 4.5;
  return (dx * dx) / 110 + (dy * dy) / 16 < 1; // 위쪽 넓은 호수
}

function buildTerrain() {
  const rnd = mulberry32(1337);
  const t = [];
  for (let y = 0; y < WORLD_H; y++) {
    const row = [];
    for (let x = 0; x < WORLD_W; x++) {
      let c = T.GRASS;
      if (inLake(x, y)) c = T.WATER;
      else if (inLake(x, y + 1) || inLake(x + 1, y) || inLake(x - 1, y) || inLake(x, y - 1)) c = T.SAND;
      else if (rnd() < 0.12) c = T.GRASS2;
      row.push(c);
    }
    t.push(row);
  }
  // 길: 가로 메인(y=16) + 세로(x=21,28) 연결
  for (let x = 4; x < WORLD_W - 4; x++) t[16][x] = T.PATH;
  for (let y = 9; y <= 24; y++) { t[y][21] = T.PATH; }
  for (let y = 16; y <= 20; y++) { t[y][28] = T.PATH; t[y][34] = T.PATH; }
  for (let y = 9; y <= 16; y++) { t[y][9] = T.PATH; t[y][32] = T.PATH; }
  for (let y = 16; y <= 24; y++) { t[y][14] = T.PATH; }
  // 밭
  for (let j = 0; j < FARM.rows; j++)
    for (let i = 0; i < FARM.cols; i++) t[FARM.y + j][FARM.x + i] = T.SOIL;
  // 꽃밭 장식 몇 군데
  for (const [fx, fy] of [[24, 20], [17, 19], [37, 22], [11, 18]]) {
    if (t[fy] && t[fy][fx] === T.GRASS) t[fy][fx] = T.FLOWERBED;
  }
  return t;
}

export const TERRAIN = buildTerrain();

export function terrainAt(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return T.WATER;
  return TERRAIN[y][x];
}

// 건물 footprint(통과불가) / 문 매핑
const BUILDING_SOLID = new Set();
const DOORS = new Map();
for (const b of BUILDINGS) {
  for (let dy = 0; dy < b.h; dy++)
    for (let dx = 0; dx < b.w; dx++) BUILDING_SOLID.add(`${b.x + dx},${b.y + dy}`);
  DOORS.set(`${b.door.x},${b.door.y}`, b);
}

// 자연물 생성 (나무/바위/덤불/꽃)
function buildObjects() {
  const rnd = mulberry32(99);
  const objs = [];
  const occupied = new Set();
  const tryPlace = (type) => {
    const x = Math.floor(rnd() * WORLD_W);
    const y = Math.floor(rnd() * WORLD_H);
    const key = `${x},${y}`;
    const c = terrainAt(x, y);
    if (c === T.WATER || c === T.PATH || c === T.SOIL) return;
    if (occupied.has(key) || BUILDING_SOLID.has(key) || DOORS.has(key)) return;
    if (inRect(x, y, { x: FARM.x - 1, y: FARM.y - 1, w: FARM.cols + 2, h: FARM.rows + 2 })) return;
    occupied.add(key);
    objs.push({ type, x, y });
  };
  for (let i = 0; i < 90; i++) tryPlace(OBJ.TREE);
  for (let i = 0; i < 28; i++) tryPlace(OBJ.ROCK);
  for (let i = 0; i < 30; i++) tryPlace(OBJ.BUSH);
  for (let i = 0; i < 40; i++) tryPlace(OBJ.FLOWER);
  return objs;
}

export const OBJECTS = buildObjects();

// 자연물 빠른 조회 맵
const OBJ_MAP = new Map();
for (const o of OBJECTS) OBJ_MAP.set(`${o.x},${o.y}`, o);
export function objectAt(x, y) {
  return OBJ_MAP.get(`${x},${y}`) || null;
}

export function doorAt(x, y) {
  return DOORS.get(`${x},${y}`) || null;
}
export function buildingHitAt(x, y) {
  for (const b of BUILDINGS) {
    if (inRect(x, y, b)) return b;
    if (b.door.x === x && b.door.y === y) return b;
  }
  return null;
}

// 통과 가능 여부 (자연물은 동적이라 removed 집합으로 제외)
export function isWalkable(x, y, removed, placedSolid) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
  const c = terrainAt(x, y);
  if (c === T.WATER) return false;
  if (BUILDING_SOLID.has(`${x},${y}`)) return false;
  const key = `${x},${y}`;
  const o = OBJ_MAP.get(key);
  if (o && o.type !== OBJ.FLOWER && !(removed && removed.has(key))) return false;
  if (placedSolid && placedSolid.has(key)) return false;
  return true;
}

export function plotIndexAt(x, y) {
  if (terrainAt(x, y) !== T.SOIL) return -1;
  return (y - FARM.y) * FARM.cols + (x - FARM.x);
}

// NPC 정의 (경로 waypoint 순환)
export const NPCS = [
  { id: 'npc1', name: '엘라', color: '#e06a8a', path: [[21, 18], [28, 18], [28, 14], [21, 12]] },
  { id: 'npc2', name: '톰', color: '#6a8ae0', path: [[14, 18], [14, 23], [9, 16], [21, 16]] },
  { id: 'npc3', name: '미라', color: '#e0b86a', path: [[34, 19], [32, 16], [28, 16], [34, 16]] },
];

export const PLAYER_START = { x: 21, y: 18 };

// 배치 가능한 장식 건물 (도구로 모은 자원 소비)
export const PLACEABLES = {
  house: { id: 'house', name: '집', icon: '🏠', wood: 8, stone: 4, solid: true },
  well: { id: 'well', name: '우물', icon: '⛲', wood: 4, stone: 8, solid: true },
  lamp: { id: 'lamp', name: '가로등', icon: '🏮', wood: 2, stone: 1, solid: false, light: true },
  fence: { id: 'fence', name: '울타리', icon: '🪵', wood: 2, stone: 0, solid: true },
  flowerpot: { id: 'flowerpot', name: '화단', icon: '🌷', wood: 1, stone: 0, solid: false },
};
