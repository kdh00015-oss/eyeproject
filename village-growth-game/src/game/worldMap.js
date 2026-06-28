// 2D 오버월드 맵 구성
//  캐릭터가 걸어다니는 격자 맵과, 진입 시 콘텐츠 패널을 여는 건물 배치를 정의한다.

export const MAP = {
  cols: 14,
  rows: 10,
  waterRows: 2, // 위쪽 2줄은 물(강/바다) — 걸어들어갈 수 없음
};

// 건물(시설) 배치
//  panel: 진입 시 열리는 콘텐츠 패널 id
//  x, y : 격자 좌표
export const WORLD_BUILDINGS = [
  { id: 'dock', name: '낚시터', icon: '🎣', panel: 'fishing', x: 3, y: 2, color: '#2f6f8f' },
  { id: 'port', name: '항구', icon: '⚓', panel: 'trade', x: 10, y: 2, color: '#3a5f7a' },
  { id: 'farm', name: '농장', icon: '🌾', panel: 'farm', x: 2, y: 6, color: '#5a7a3a' },
  { id: 'barn', name: '축사', icon: '🛖', panel: 'livestock', x: 5, y: 8, color: '#7a5a3a' },
  { id: 'townhall', name: '마을회관', icon: '🏛️', panel: 'build', x: 7, y: 5, color: '#6a6a8a' },
  { id: 'market', name: '시장', icon: '🏪', panel: 'market', x: 11, y: 6, color: '#8a6a3a' },
  { id: 'lab', name: '연구소', icon: '🔬', panel: 'research', x: 12, y: 8, color: '#4a6a8a' },
];

// 장식용 나무 위치 (충돌 없음, 분위기용)
export const DECOR_TREES = [
  { x: 0, y: 4 }, { x: 1, y: 9 }, { x: 6, y: 9 }, { x: 8, y: 7 },
  { x: 13, y: 4 }, { x: 9, y: 9 }, { x: 4, y: 5 }, { x: 13, y: 9 },
];

export const PLAYER_START = { x: 7, y: 7 };

// 좌표 헬퍼
export function isWater(y) {
  return y < MAP.waterRows;
}
export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP.cols && y < MAP.rows;
}
export function buildingAt(x, y) {
  return WORLD_BUILDINGS.find((b) => b.x === x && b.y === y) || null;
}
