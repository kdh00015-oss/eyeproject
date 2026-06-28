// 판매 가능한 재화(goods) 통합 카탈로그
//  작물 + 물고기 + 축산물을 하나의 목록으로 모으고,
//  식량 가치(foodValue)와 분류(category)를 부여한다.

import { CROPS } from './crops';
import { FISH } from './fishing';
import { ANIMAL_PRODUCTS } from './livestock';

export const GOODS = {};

// 작물: 모두 식량 가치 1
for (const c of Object.values(CROPS)) {
  GOODS[c.id] = {
    id: c.id,
    name: c.name,
    icon: c.icon,
    basePrice: c.basePrice,
    category: 'crop',
    foodValue: 1,
  };
}

// 물고기: 식량 가치 1
for (const f of Object.values(FISH)) {
  GOODS[f.id] = {
    id: f.id,
    name: f.name,
    icon: f.icon,
    basePrice: f.basePrice,
    category: 'fish',
    foodValue: 1,
  };
}

// 축산물: 식량 가치 차등 (양털은 식량 아님)
const PRODUCT_FOOD = { egg: 0.5, milk: 0.8, truffle: 1, wool: 0 };
for (const p of Object.values(ANIMAL_PRODUCTS)) {
  GOODS[p.id] = {
    id: p.id,
    name: p.name,
    icon: p.icon,
    basePrice: p.basePrice,
    category: 'animal',
    foodValue: PRODUCT_FOOD[p.id] ?? 0,
  };
}

export const GOODS_LIST = Object.values(GOODS);

// 식량으로 쓸 수 있는 재화 id (값이 싼 것부터 소비하도록 가격순 정렬)
export const EDIBLE_IDS = GOODS_LIST.filter((g) => g.foodValue > 0)
  .sort((a, b) => a.basePrice - b.basePrice)
  .map((g) => g.id);
