// 아이템 카탈로그: 기존 재화(작물/생선/축산물) + 자원(목재/돌) + 제작품 + 소비품
//  희귀도/분류/설명/최대보관수량/소비효과를 정의한다.

import { CROPS } from './crops';
import { FISH } from './fishing';
import { ANIMAL_PRODUCTS } from './livestock';

// 희귀도
export const RARITY = {
  common: { id: 'common', name: '일반', color: '#9aa4b2' },
  uncommon: { id: 'uncommon', name: '고급', color: '#5fc36a' },
  rare: { id: 'rare', name: '희귀', color: '#5b9cf0' },
  epic: { id: 'epic', name: '영웅', color: '#b06bf0' },
};

// 분류
export const CATEGORY = {
  material: '재료',
  consumable: '소비',
  equipment: '장비',
};

const ITEMS = {};
function add(it) { ITEMS[it.id] = { maxStack: 99, rarity: 'common', category: 'material', ...it }; }

// 작물
const CROP_RARITY = { wheat: 'common', potato: 'common', corn: 'uncommon', strawberry: 'uncommon', grape: 'rare' };
for (const c of Object.values(CROPS)) add({ id: c.id, name: c.name, icon: c.icon, rarity: CROP_RARITY[c.id] || 'common', category: 'material', desc: `${c.name} — 농장에서 수확한 작물. 판매하거나 요리에 사용합니다.` });

// 생선 (희귀종은 등급 ↑)
for (const f of Object.values(FISH)) add({ id: f.id, name: f.name, icon: f.icon, rarity: f.rare ? (f.basePrice >= 100 ? 'epic' : 'rare') : 'common', category: 'material', desc: `${f.name} — 낚시로 잡은 물고기.${f.rare ? ' 희귀한 어종입니다!' : ''}` });

// 축산물
const PROD_RARITY = { egg: 'common', milk: 'common', wool: 'uncommon', truffle: 'rare' };
for (const p of Object.values(ANIMAL_PRODUCTS)) add({ id: p.id, name: p.name, icon: p.icon, rarity: PROD_RARITY[p.id] || 'common', category: 'material', desc: `${p.name} — 가축에게서 얻은 축산물.` });

// 기본 자원
add({ id: 'wood', name: '목재', icon: '🪵', rarity: 'common', category: 'material', desc: '나무를 베어 얻은 목재. 건설·제작의 기본 재료.' });
add({ id: 'stone', name: '돌', icon: '🪨', rarity: 'common', category: 'material', desc: '바위에서 캔 돌. 튼튼한 건축 재료.' });
add({ id: 'feed', name: '사료', icon: '🌿', rarity: 'common', category: 'material', desc: '가축에게 먹이는 사료.' });

// 제작품 (재료/장비)
add({ id: 'plank', name: '판자', icon: '🟫', rarity: 'uncommon', category: 'material', desc: '목재를 가공한 판자. 고급 건축에 쓰입니다.' });
add({ id: 'block', name: '석재블록', icon: '🧱', rarity: 'uncommon', category: 'material', desc: '돌을 다듬은 블록. 견고한 구조물 재료.' });
add({ id: 'sturdyAxe', name: '강화 도끼', icon: '🪓', rarity: 'rare', category: 'equipment', maxStack: 1, desc: '잘 벼린 도끼. 장착하면 벌목 시 목재를 더 얻습니다. (+2 목재/벌목)' });
add({ id: 'sturdyPick', name: '강화 곡괭이', icon: '⛏️', rarity: 'rare', category: 'equipment', maxStack: 1, desc: '단단한 곡괭이. 장착하면 채굴 시 돌을 더 얻습니다. (+2 돌/채굴)' });

// 소비품
add({ id: 'bread', name: '빵', icon: '🍞', rarity: 'common', category: 'consumable', desc: '갓 구운 빵. 사용하면 주민 행복도가 +6 오릅니다.', effect: { happiness: 6 } });
add({ id: 'feast', name: '잔칫상', icon: '🍲', rarity: 'uncommon', category: 'consumable', desc: '푸짐한 잔칫상. 사용하면 주민 행복도가 +15 오릅니다.', effect: { happiness: 15 } });

export const ITEM_DB = ITEMS;
export function itemDef(id) { return ITEMS[id] || { id, name: id, icon: '❓', rarity: 'common', category: 'material', maxStack: 99, desc: '' }; }

// 인벤토리에서 표시할 분류 순서/희귀도 정렬용 가중치
export const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3 };
export const CATEGORY_ORDER = { material: 0, consumable: 1, equipment: 2 };
