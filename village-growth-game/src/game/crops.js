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
  // --- 확장 작물 ---
  carrot: { id: 'carrot', name: '당근', icon: '🥕', seedCost: 6, growthDays: 5, yield: 7, basePrice: 9, seasons: ['spring', 'fall'] },
  cabbage: { id: 'cabbage', name: '양배추', icon: '🥬', seedCost: 10, growthDays: 5, yield: 7, basePrice: 13, seasons: ['spring', 'fall'] },
  onion: { id: 'onion', name: '양파', icon: '🧅', seedCost: 8, growthDays: 4, yield: 8, basePrice: 10, seasons: ['spring', 'summer'] },
  garlic: { id: 'garlic', name: '마늘', icon: '🧄', seedCost: 9, growthDays: 4, yield: 7, basePrice: 12, seasons: ['spring'] },
  tomato: { id: 'tomato', name: '토마토', icon: '🍅', seedCost: 14, growthDays: 6, yield: 7, basePrice: 16, seasons: ['summer'] },
  eggplant: { id: 'eggplant', name: '가지', icon: '🍆', seedCost: 16, growthDays: 6, yield: 7, basePrice: 20, seasons: ['summer'] },
  chili: { id: 'chili', name: '고추', icon: '🌶️', seedCost: 15, growthDays: 5, yield: 7, basePrice: 18, seasons: ['summer', 'fall'] },
  blueberry: { id: 'blueberry', name: '블루베리', icon: '🫐', seedCost: 22, growthDays: 7, yield: 8, basePrice: 24, seasons: ['summer'] },
  melon: { id: 'melon', name: '멜론', icon: '🍈', seedCost: 28, growthDays: 9, yield: 5, basePrice: 40, seasons: ['summer'] },
  pumpkin: { id: 'pumpkin', name: '호박', icon: '🎃', seedCost: 20, growthDays: 8, yield: 6, basePrice: 28, seasons: ['fall'] },
  sweetPotato: { id: 'sweetPotato', name: '고구마', icon: '🍠', seedCost: 12, growthDays: 6, yield: 8, basePrice: 15, seasons: ['fall'] },
  kale: { id: 'kale', name: '겨울초', icon: '🥬', seedCost: 18, growthDays: 6, yield: 6, basePrice: 22, seasons: ['winter'] },
  ginseng: { id: 'ginseng', name: '인삼', icon: '🌿', seedCost: 45, growthDays: 12, yield: 4, basePrice: 90, seasons: ['fall', 'winter'] },
};

export const CROP_LIST = Object.values(CROPS);
