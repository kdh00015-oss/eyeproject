// 마을 건물 정의 및 비용/효과 계산
//  레벨 0 = 미건설. 건설 시 레벨 1이 되고 이후 업그레이드.
//  cost(level) = baseCost * costGrowth^level (현재 레벨 기준 다음 단계 비용)

export const BUILDINGS = {
  house: {
    id: 'house',
    name: '집',
    icon: '🏠',
    baseCost: 60,
    costGrowth: 1.6,
    maxLevel: 10,
    desc: '주민 +6 즉시 이주 · 최대 인구 +7 / 레벨',
  },
  warehouse: {
    id: 'warehouse',
    name: '창고',
    icon: '🏚️',
    baseCost: 80,
    costGrowth: 1.6,
    maxLevel: 8,
    desc: '저장 한도 +60 / 레벨',
  },
  market: {
    id: 'market',
    name: '시장',
    icon: '🏪',
    baseCost: 120,
    costGrowth: 1.7,
    maxLevel: 8,
    desc: '판매가 +6% / 레벨',
  },
  port: {
    id: 'port',
    name: '항구',
    icon: '⚓',
    baseCost: 300,
    costGrowth: 1.8,
    maxLevel: 6,
    desc: '바다 낚시·교역 가능, 교역수익 +8% / 레벨',
  },
  lab: {
    id: 'lab',
    name: '연구소',
    icon: '🔬',
    baseCost: 250,
    costGrowth: 1.8,
    maxLevel: 6,
    desc: '기술 연구 가능, 연구비 -5% / 레벨',
  },
  school: {
    id: 'school',
    name: '학교',
    icon: '🏫',
    baseCost: 180,
    costGrowth: 1.7,
    maxLevel: 6,
    desc: '행복도 +4 / 레벨',
  },
};

export const BUILDING_LIST = Object.values(BUILDINGS);

// 집을 지을 때마다 즉시 이주해 오는 주민 수
export const POP_PER_HOUSE = 6;

// 현재 레벨에서 다음 단계(건설/업그레이드) 비용
export function buildingCost(buildingId, level) {
  const b = BUILDINGS[buildingId];
  return Math.round(b.baseCost * Math.pow(b.costGrowth, level));
}
