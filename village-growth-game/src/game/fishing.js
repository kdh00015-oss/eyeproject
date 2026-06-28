// 어업: 낚시터와 물고기 정의
//  낚시터별로 잡히는 물고기 종류/가격/출현 가중치가 다르다.
//  weight 가 낮을수록 희귀(rare) 물고기.
//  sea(바다)는 항구(port) 건설이 필요하다.

export const FISHING_SPOTS = {
  river: {
    id: 'river',
    name: '강',
    icon: '🏞️',
    requires: null,
    fish: [
      { id: 'crucian', name: '붕어', icon: '🐟', basePrice: 6, weight: 50 },
      { id: 'minnow', name: '피라미', icon: '🐟', basePrice: 4, weight: 48 },
      { id: 'catfish', name: '메기', icon: '🐠', basePrice: 12, weight: 30 },
      { id: 'eel', name: '장어', icon: '🐍', basePrice: 22, weight: 18 },
      { id: 'carp', name: '잉어', icon: '🎏', basePrice: 30, weight: 8, rare: true },
      { id: 'sweetfish', name: '은어', icon: '🐟', basePrice: 38, weight: 6, rare: true },
      { id: 'goldenCarp', name: '황금잉어', icon: '🐡', basePrice: 200, weight: 1, rare: true, legendary: true },
    ],
  },
  lake: {
    id: 'lake',
    name: '호수',
    icon: '🛶',
    requires: null,
    fish: [
      { id: 'trout', name: '송어', icon: '🐟', basePrice: 15, weight: 45 },
      { id: 'sunfish', name: '블루길', icon: '🐟', basePrice: 9, weight: 42 },
      { id: 'bass', name: '배스', icon: '🐠', basePrice: 20, weight: 30 },
      { id: 'pike', name: '강꼬치', icon: '🐠', basePrice: 28, weight: 16 },
      { id: 'snakehead', name: '가물치', icon: '🐍', basePrice: 45, weight: 7, rare: true },
      { id: 'sturgeon', name: '철갑상어', icon: '🐡', basePrice: 80, weight: 4, rare: true },
      { id: 'rainbowTrout', name: '무지개송어', icon: '🌈', basePrice: 240, weight: 1, rare: true, legendary: true },
    ],
  },
  sea: {
    id: 'sea',
    name: '바다',
    icon: '🌊',
    requires: { building: 'port', level: 1 },
    fish: [
      { id: 'anchovy', name: '멸치', icon: '🐟', basePrice: 8, weight: 48 },
      { id: 'mackerel', name: '고등어', icon: '🐟', basePrice: 12, weight: 45 },
      { id: 'squid', name: '오징어', icon: '🦑', basePrice: 18, weight: 28 },
      { id: 'flatfish', name: '광어', icon: '🐠', basePrice: 26, weight: 22 },
      { id: 'octopus', name: '문어', icon: '🐙', basePrice: 34, weight: 16 },
      { id: 'lobster', name: '바닷가재', icon: '🦞', basePrice: 70, weight: 8, rare: true },
      { id: 'tuna', name: '참치', icon: '🐡', basePrice: 60, weight: 10, rare: true },
      { id: 'shark', name: '상어', icon: '🦈', basePrice: 140, weight: 3, rare: true },
      { id: 'coelacanth', name: '실러캔스', icon: '🐉', basePrice: 380, weight: 1, rare: true, legendary: true },
    ],
  },
};

export const SPOT_LIST = Object.values(FISHING_SPOTS);

// 모든 물고기를 id로 모은 카탈로그
export const FISH = {};
for (const spot of SPOT_LIST) {
  for (const f of spot.fish) FISH[f.id] = f;
}
