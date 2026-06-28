// 농업: 작물 정의
//  seedCost   : 파종 비용(골드)
//  growthDays : 성장 일수
//  yield      : 수확량(개)
//  basePrice  : 기본 판매 단가
//  seasons    : 파종 가능한 계절 (겨울은 대부분 불가)

export const CROPS = {
  wheat: {
    id: 'wheat',
    name: '밀',
    icon: '🌾',
    seedCost: 5,
    growthDays: 4,
    yield: 6,
    basePrice: 8,
    seasons: ['spring', 'summer', 'fall'],
  },
  potato: {
    id: 'potato',
    name: '감자',
    icon: '🥔',
    seedCost: 8,
    growthDays: 5,
    yield: 8,
    basePrice: 7,
    seasons: ['spring', 'fall'],
  },
  corn: {
    id: 'corn',
    name: '옥수수',
    icon: '🌽',
    seedCost: 12,
    growthDays: 6,
    yield: 7,
    basePrice: 14,
    seasons: ['summer'],
  },
  strawberry: {
    id: 'strawberry',
    name: '딸기',
    icon: '🍓',
    seedCost: 18,
    growthDays: 7,
    yield: 6,
    basePrice: 26,
    seasons: ['spring'],
  },
  grape: {
    id: 'grape',
    name: '포도',
    icon: '🍇',
    seedCost: 25,
    growthDays: 9,
    yield: 8,
    basePrice: 30,
    seasons: ['summer', 'fall'],
  },
};

export const CROP_LIST = Object.values(CROPS);
