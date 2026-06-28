// 게임 전반의 상수 정의: 계절, 날씨, 직위, 마을 등급, 인근 마을, 핵심 수치

// --- 계절 ---
export const SEASONS = [
  { id: 'spring', name: '봄', icon: '🌸' },
  { id: 'summer', name: '여름', icon: '☀️' },
  { id: 'fall', name: '가을', icon: '🍂' },
  { id: 'winter', name: '겨울', icon: '❄️' },
];
export const DAYS_PER_SEASON = 30;

// --- 날씨 (생산량 배율 포함) ---
export const WEATHERS = {
  sunny: { id: 'sunny', name: '맑음', icon: '☀️', crop: 1.0, fish: 1.0 },
  rain: { id: 'rain', name: '비', icon: '🌧️', crop: 1.15, fish: 1.1 },
  storm: { id: 'storm', name: '폭풍', icon: '⛈️', crop: 0.9, fish: 0.4 },
  drought: { id: 'drought', name: '가뭄', icon: '🏜️', crop: 0.75, fish: 0.9 },
};

// 계절별 날씨 출현 가중치
export const WEATHER_TABLE = {
  spring: [
    { id: 'sunny', weight: 55 },
    { id: 'rain', weight: 35 },
    { id: 'storm', weight: 5 },
    { id: 'drought', weight: 5 },
  ],
  summer: [
    { id: 'sunny', weight: 45 },
    { id: 'rain', weight: 25 },
    { id: 'storm', weight: 15 },
    { id: 'drought', weight: 15 },
  ],
  fall: [
    { id: 'sunny', weight: 55 },
    { id: 'rain', weight: 30 },
    { id: 'storm', weight: 10 },
    { id: 'drought', weight: 5 },
  ],
  winter: [
    { id: 'sunny', weight: 60 },
    { id: 'rain', weight: 10 },
    { id: 'storm', weight: 25 },
    { id: 'drought', weight: 5 },
  ],
};

// --- 직위 (조건 충족 시 자동 승급) ---
// req 필드: population, money, influence, buildingLevels(총합), researchTotal(총합), trades(교역로 수)
export const RANKS = [
  { id: 'commoner', name: '평민', icon: '🧑‍🌾', req: {} },
  { id: 'foreman', name: '작업반장', icon: '🧑‍🔧', req: { population: 6, money: 300 } },
  {
    id: 'manager',
    name: '마을 관리자',
    icon: '🧑‍💼',
    req: { population: 12, money: 1000, buildingLevels: 4 },
  },
  {
    id: 'chief',
    name: '촌장',
    icon: '🎖️',
    req: { population: 20, money: 3000, influence: 20 },
  },
  {
    id: 'mayor',
    name: '시장',
    icon: '🏅',
    req: { population: 30, money: 8000, influence: 50, researchTotal: 5 },
  },
  {
    id: 'lord',
    name: '영주',
    icon: '🛡️',
    req: { population: 45, money: 20000, influence: 100, trades: 3 },
  },
  {
    id: 'governor',
    name: '총독',
    icon: '🏛️',
    req: { population: 60, money: 50000, influence: 200 },
  },
  {
    id: 'king',
    name: '국왕',
    icon: '👑',
    req: { population: 80, money: 120000, influence: 400 },
  },
];

// --- 마을 등급 (점수 기반) ---
export const VILLAGE_GRADES = [
  { name: '외딴 정착지', min: 0 },
  { name: '작은 마을', min: 12 },
  { name: '마을', min: 28 },
  { name: '큰 마을', min: 55 },
  { name: '읍', min: 95 },
  { name: '도시', min: 160 },
  { name: '대도시', min: 260 },
];

// --- 인근 마을 (탐험으로 발견 → 교역로 개설) ---
export const VILLAGE_TEMPLATES = [
  { id: 'v1', name: '바람골', distance: 2, tradeIncome: 8, influence: 6, openCost: 200 },
  { id: 'v2', name: '은빛호수', distance: 3, tradeIncome: 14, influence: 10, openCost: 450 },
  { id: 'v3', name: '붉은언덕', distance: 4, tradeIncome: 22, influence: 16, openCost: 800 },
  { id: 'v4', name: '푸른항구', distance: 5, tradeIncome: 35, influence: 26, openCost: 1500 },
  { id: 'v5', name: '황금평원', distance: 7, tradeIncome: 55, influence: 40, openCost: 3000 },
];

// --- 핵심 수치 ---
export const START_MONEY = 200;
export const START_POP = 3;
export const FARM_PLOTS_START = 9; // 시작 밭 칸 수
export const FARM_PLOTS_MAX = 16; // 개간 최대
export const FOOD_PER_POP = 0.4; // 주민 1명당 하루 식량 소비
export const TAX_PER_POP = 3; // 주민 1명당 세금 기준액
export const DEFAULT_TAX = 10; // 기본 세율(%)
export const BASE_FISH_PER_DAY = 3; // 하루 낚시 횟수 기본값
export const RECLAIM_BASE_COST = 120; // 밭 개간 기본 비용
export const EXPLORE_BASE_COST = 80; // 탐험 기본 비용
export const MAX_LOG = 60; // 로그 최대 보관 수
