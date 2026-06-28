// 축산: 가축과 생산품 정의
//  feedPerDay  : 하루 사료 소비량
//  product     : 생산하는 축산물 id
//  productDays : 생산 주기(일)
//  productQty  : 주기마다 마리당 생산량

export const ANIMALS = {
  chicken: {
    id: 'chicken',
    name: '닭',
    icon: '🐔',
    buyCost: 30,
    feedPerDay: 1,
    product: 'egg',
    productDays: 1,
    productQty: 1,
  },
  pig: {
    id: 'pig',
    name: '돼지',
    icon: '🐷',
    buyCost: 80,
    feedPerDay: 3,
    product: 'truffle',
    productDays: 2,
    productQty: 1,
  },
  cow: {
    id: 'cow',
    name: '소',
    icon: '🐄',
    buyCost: 150,
    feedPerDay: 4,
    product: 'milk',
    productDays: 1,
    productQty: 1,
  },
  sheep: {
    id: 'sheep',
    name: '양',
    icon: '🐑',
    buyCost: 120,
    feedPerDay: 3,
    product: 'wool',
    productDays: 3,
    productQty: 1,
  },
};

export const ANIMAL_LIST = Object.values(ANIMALS);

// 축산물 (판매 가능한 재화)
export const ANIMAL_PRODUCTS = {
  egg: { id: 'egg', name: '달걀', icon: '🥚', basePrice: 4 },
  truffle: { id: 'truffle', name: '송로버섯', icon: '🍄', basePrice: 50 },
  milk: { id: 'milk', name: '우유', icon: '🥛', basePrice: 18 },
  wool: { id: 'wool', name: '양털', icon: '🧶', basePrice: 45 },
};

// 사료 (시장에서 구매하는 소모품)
export const FEED = { id: 'feed', name: '사료', icon: '🌿', buyPrice: 2 };
