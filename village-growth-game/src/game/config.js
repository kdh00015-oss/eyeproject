// 게임 전반의 상수와 건물/자원 정의

export const GRID_SIZE = 6; // 6 x 6 타일
export const TICK_MS = 1000; // 1초마다 생산 계산
export const SAVE_KEY = 'village-growth-save-v1';

// 자원 종류
export const RESOURCES = {
  gold: { label: '금화', icon: '💰' },
  wood: { label: '나무', icon: '🪵' },
  food: { label: '식량', icon: '🌾' },
};

// 건물 정의
//  cost     : 건설 비용
//  maxPop   : 최대 인구 증가량
//  workers  : 가동에 필요한 일꾼 수
//  produces : 초당 생산량 (일꾼이 충분할 때 기준)
export const BUILDINGS = {
  house: {
    id: 'house',
    name: '오두막',
    icon: '🏠',
    desc: '최대 인구 +3',
    cost: { wood: 10 },
    maxPop: 3,
    workers: 0,
    produces: {},
  },
  farm: {
    id: 'farm',
    name: '농장',
    icon: '🌱',
    desc: '식량 +0.8/초 (일꾼 1)',
    cost: { wood: 15, gold: 5 },
    maxPop: 0,
    workers: 1,
    produces: { food: 0.8 },
  },
  lumber: {
    id: 'lumber',
    name: '벌목장',
    icon: '🪓',
    desc: '나무 +0.5/초 (일꾼 1)',
    cost: { wood: 20 },
    maxPop: 0,
    workers: 1,
    produces: { wood: 0.5 },
  },
  market: {
    id: 'market',
    name: '시장',
    icon: '🏪',
    desc: '금화 +0.5/초 (일꾼 1)',
    cost: { wood: 25, food: 10 },
    maxPop: 0,
    workers: 1,
    produces: { gold: 0.5 },
  },
};

// 인구/성장 관련 상수
export const BASE_MAX_POP = 2; // 건물 없이 기본 수용 인구
export const FOOD_PER_POP = 0.15; // 인구 1명이 초당 소비하는 식량
export const POP_GROWTH = 0.08; // 조건 충족 시 초당 인구 증가
export const GROWTH_FOOD_THRESHOLD = 5; // 이 이상 식량이 비축돼야 인구 성장
export const STARVE_RATE = 0.25; // 식량 부족 시 초당 인구 감소
export const DEMOLISH_REFUND = 0.5; // 철거 시 자원 환급 비율

// 새 게임 시작 상태
export const INITIAL_STATE = {
  resources: { gold: 5, wood: 30, food: 15 },
  population: 1,
  grid: Array(GRID_SIZE * GRID_SIZE).fill(null),
};
