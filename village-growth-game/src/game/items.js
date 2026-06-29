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
  legendary: { id: 'legendary', name: '전설', color: '#f0a93b' },
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
for (const f of Object.values(FISH)) add({ id: f.id, name: f.name, icon: f.icon, rarity: f.legendary ? 'legendary' : f.rare ? (f.basePrice >= 100 ? 'epic' : 'rare') : 'common', category: 'material', desc: `${f.name} — 낚시로 잡은 물고기.${f.legendary ? ' ✨전설의 물고기!' : f.rare ? ' 희귀한 어종입니다!' : ''}` });

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
add({ id: 'sturdyAxe', name: '강화 도끼', icon: '🪓', rarity: 'rare', category: 'equipment', slot: 'tool', maxStack: 1, desc: '잘 벼린 도끼. 장착하면 벌목 시 목재를 더 얻습니다. (+2 목재/벌목)' });
add({ id: 'sturdyPick', name: '강화 곡괭이', icon: '⛏️', rarity: 'rare', category: 'equipment', slot: 'tool', maxStack: 1, desc: '단단한 곡괭이. 장착하면 채굴 시 돌을 더 얻습니다. (+2 돌/채굴)' });

// --- 전투 장비 (slot/atk/def/hp/maxDur) ---
function gear(id, name, icon, slot, rarity, stats, dur, desc) {
  add({ id, name, icon, rarity, category: 'equipment', slot, maxStack: 1, atk: stats.atk || 0, def: stats.def || 0, hp: stats.hp || 0, maxDur: dur, desc });
}
gear('woodenSword', '나무검', '🗡️', 'weapon', 'common', { atk: 6 }, 40, '낡은 나무검. 공격력 +6');
gear('ironSword', '철검', '⚔️', 'weapon', 'uncommon', { atk: 14 }, 60, '단단한 철검. 공격력 +14');
gear('steelSword', '강철검', '🗡️', 'weapon', 'rare', { atk: 19, hp: 6 }, 80, '잘 벼린 강철검. 공격력 +19, 체력 +6');
gear('knightBlade', '기사검', '🗡️', 'weapon', 'rare', { atk: 24, hp: 10 }, 90, '기사의 명검. 공격력 +24');
gear('mythrilBlade', '미스릴 검', '⚔️', 'weapon', 'epic', { atk: 34, hp: 16 }, 120, '미스릴로 벼린 명검. 공격력 +34, 체력 +16');
gear('dragonFang', '용아도', '🔱', 'weapon', 'legendary', { atk: 48, def: 6, hp: 24 }, 150, '용의 이빨로 만든 전설의 검. 공격 +48, 방어 +6, 체력 +24');
gear('clothArmor', '천 갑옷', '🧥', 'armor', 'common', { def: 3, hp: 10 }, 40, '방어력 +3, 체력 +10');
gear('leatherArmor', '가죽 갑옷', '🦺', 'armor', 'uncommon', { def: 6, hp: 20 }, 60, '방어력 +6, 체력 +20');
gear('plateArmor', '판금 갑옷', '🛡️', 'armor', 'rare', { def: 14, hp: 40 }, 100, '방어력 +14, 체력 +40');
gear('mythrilArmor', '미스릴 갑옷', '🛡️', 'armor', 'epic', { def: 22, hp: 60 }, 130, '가볍고 단단한 미스릴 갑옷. 방어 +22, 체력 +60');
gear('dragonPlate', '용린 갑옷', '🐲', 'armor', 'legendary', { def: 32, hp: 100 }, 160, '용 비늘로 만든 전설의 갑옷. 방어 +32, 체력 +100');
gear('leatherCap', '가죽 투구', '🪖', 'helmet', 'common', { def: 2 }, 40, '방어력 +2');
gear('ironHelm', '철 투구', '⛑️', 'helmet', 'uncommon', { def: 5, hp: 8 }, 60, '방어력 +5');
gear('leatherGloves', '가죽 장갑', '🧤', 'gloves', 'common', { def: 1, atk: 1 }, 40, '공/방 +1');
gear('ironGauntlet', '철 건틀릿', '🥊', 'gloves', 'uncommon', { def: 3, atk: 2 }, 60, '공격 +2, 방어 +3');
gear('leatherBoots', '가죽 신발', '🥾', 'boots', 'common', { def: 1, hp: 5 }, 40, '방어 +1, 체력 +5');
gear('ironBoots', '철 장화', '🦶', 'boots', 'uncommon', { def: 3, hp: 10 }, 60, '방어 +3, 체력 +10');
gear('woodCharm', '나무 부적', '📿', 'necklace', 'common', { hp: 15 }, 0, '체력 +15');
gear('rubyAmulet', '루비 목걸이', '💎', 'necklace', 'rare', { hp: 30, atk: 4 }, 0, '체력 +30, 공격 +4');
gear('copperRing', '구리 반지', '💍', 'ring', 'common', { atk: 2 }, 0, '공격 +2');
gear('goldRing', '황금 반지', '💍', 'ring', 'rare', { atk: 4, def: 2 }, 0, '공/방 +');

// 사냥 재료 (몬스터 드롭 → 대장간 제작 재료)
add({ id: 'hide', name: '가죽', icon: '🟫', rarity: 'common', category: 'material', desc: '몬스터에게서 얻은 가죽. 방어구 제작 재료.' });
add({ id: 'bone', name: '뼈', icon: '🦴', rarity: 'common', category: 'material', desc: '단단한 뼈. 무기 제작 재료.' });
add({ id: 'oreIron', name: '철광석', icon: '🪨', rarity: 'uncommon', category: 'material', desc: '제련하면 무기·방어구가 됩니다.' });
add({ id: 'crystal', name: '마력 수정', icon: '🔮', rarity: 'rare', category: 'material', desc: '장비 강화에 쓰이는 신비한 수정.' });
add({ id: 'steel', name: '강철 주괴', icon: '⬛', rarity: 'uncommon', category: 'material', desc: '철광석을 제련한 강철. 고급 장비 제작 재료.' });
add({ id: 'mythril', name: '미스릴', icon: '🔷', rarity: 'epic', category: 'material', desc: '깊은 곳에서만 나는 희귀 금속. 최고급 장비 재료.' });
add({ id: 'dragonScale', name: '용 비늘', icon: '🐉', rarity: 'legendary', category: 'material', desc: '강력한 용에게서 얻은 비늘. 전설 장비 재료.' });

// 소비품
add({ id: 'bread', name: '빵', icon: '🍞', rarity: 'common', category: 'consumable', desc: '갓 구운 빵. 사용하면 주민 행복도가 +6 오릅니다.', effect: { happiness: 6 } });
add({ id: 'feast', name: '잔칫상', icon: '🍲', rarity: 'uncommon', category: 'consumable', desc: '푸짐한 잔칫상. 사용하면 주민 행복도가 +15 오릅니다.', effect: { happiness: 15 } });
add({ id: 'potion', name: '치유 물약', icon: '🧪', rarity: 'uncommon', category: 'consumable', desc: '전투 중 체력을 40 회복합니다.', effect: { heal: 40 } });

// --- 가공 재료/식품 (제작 확장) ---
add({ id: 'flour', name: '밀가루', icon: '🌾', rarity: 'common', category: 'material', desc: '밀을 빻은 가루. 빵·파이의 재료.' });
add({ id: 'cheese', name: '치즈', icon: '🧀', rarity: 'uncommon', category: 'consumable', desc: '숙성 치즈. 행복도 +10.', effect: { happiness: 10 } });
add({ id: 'jam', name: '잼', icon: '🍯', rarity: 'uncommon', category: 'consumable', desc: '달콤한 베리 잼. 행복도 +8.', effect: { happiness: 8 } });
add({ id: 'salad', name: '샐러드', icon: '🥗', rarity: 'uncommon', category: 'consumable', desc: '신선한 채소 샐러드. 행복도 +12.', effect: { happiness: 12 } });
add({ id: 'honeyTea', name: '꿀차', icon: '🍵', rarity: 'common', category: 'consumable', desc: '따뜻한 꿀차. 행복도 +9.', effect: { happiness: 9 } });
add({ id: 'pumpkinPie', name: '호박파이', icon: '🥧', rarity: 'rare', category: 'consumable', desc: '향긋한 호박파이. 행복도 +16.', effect: { happiness: 16 } });
add({ id: 'wine', name: '와인', icon: '🍷', rarity: 'rare', category: 'consumable', desc: '잘 익은 포도주. 행복도 +18.', effect: { happiness: 18 } });
add({ id: 'sashimi', name: '회', icon: '🍣', rarity: 'rare', category: 'consumable', desc: '신선한 생선회. 행복도 +14.', effect: { happiness: 14 } });
add({ id: 'greatPotion', name: '상급 물약', icon: '⚗️', rarity: 'rare', category: 'consumable', desc: '전투 중 체력을 90 회복합니다.', effect: { heal: 90 } });

export const ITEM_DB = ITEMS;
export function itemDef(id) { return ITEMS[id] || { id, name: id, icon: '❓', rarity: 'common', category: 'material', maxStack: 99, desc: '' }; }

// 인벤토리에서 표시할 분류 순서/희귀도 정렬용 가중치
export const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
export const CATEGORY_ORDER = { material: 0, consumable: 1, equipment: 2 };
