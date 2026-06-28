// 제작(Crafting) 레시피
//  inputs/out 의 id는 아이템 id (wood/stone 은 자원 필드, 그 외는 인벤토리)

export const RECIPES = [
  { id: 'plank', out: { id: 'plank', qty: 1 }, inputs: [{ id: 'wood', qty: 3 }], desc: '목재 3 → 판자 1' },
  { id: 'block', out: { id: 'block', qty: 1 }, inputs: [{ id: 'stone', qty: 3 }], desc: '돌 3 → 석재블록 1' },
  { id: 'bread', out: { id: 'bread', qty: 1 }, inputs: [{ id: 'wheat', qty: 2 }], desc: '밀 2 → 빵 1' },
  { id: 'feast', out: { id: 'feast', qty: 1 }, inputs: [{ id: 'bread', qty: 2 }, { id: 'milk', qty: 1 }], desc: '빵 2 + 우유 1 → 잔칫상 1' },
  { id: 'sturdyAxe', out: { id: 'sturdyAxe', qty: 1 }, inputs: [{ id: 'plank', qty: 3 }, { id: 'block', qty: 1 }], desc: '판자 3 + 블록 1 → 강화 도끼' },
  { id: 'sturdyPick', out: { id: 'sturdyPick', qty: 1 }, inputs: [{ id: 'plank', qty: 1 }, { id: 'block', qty: 3 }], desc: '판자 1 + 블록 3 → 강화 곡괭이' },
  // 대장간 (장비 제작)
  { id: 'woodenSword', out: { id: 'woodenSword', qty: 1 }, inputs: [{ id: 'wood', qty: 5 }, { id: 'bone', qty: 1 }], station: 'forge', desc: '목재 5 + 뼈 1 → 나무검' },
  { id: 'ironSword', out: { id: 'ironSword', qty: 1 }, inputs: [{ id: 'oreIron', qty: 5 }, { id: 'plank', qty: 2 }], station: 'forge', desc: '철광석 5 + 판자 2 → 철검' },
  { id: 'clothArmor', out: { id: 'clothArmor', qty: 1 }, inputs: [{ id: 'hide', qty: 3 }], station: 'forge', desc: '가죽 3 → 천 갑옷' },
  { id: 'leatherArmor', out: { id: 'leatherArmor', qty: 1 }, inputs: [{ id: 'hide', qty: 6 }, { id: 'bone', qty: 2 }], station: 'forge', desc: '가죽 6 + 뼈 2 → 가죽 갑옷' },
  { id: 'leatherCap', out: { id: 'leatherCap', qty: 1 }, inputs: [{ id: 'hide', qty: 2 }], station: 'forge', desc: '가죽 2 → 가죽 투구' },
  { id: 'leatherGloves', out: { id: 'leatherGloves', qty: 1 }, inputs: [{ id: 'hide', qty: 2 }], station: 'forge', desc: '가죽 2 → 가죽 장갑' },
  { id: 'leatherBoots', out: { id: 'leatherBoots', qty: 1 }, inputs: [{ id: 'hide', qty: 2 }], station: 'forge', desc: '가죽 2 → 가죽 신발' },
  { id: 'ironHelm', out: { id: 'ironHelm', qty: 1 }, inputs: [{ id: 'oreIron', qty: 3 }], station: 'forge', desc: '철광석 3 → 철 투구' },
  { id: 'copperRing', out: { id: 'copperRing', qty: 1 }, inputs: [{ id: 'oreIron', qty: 2 }], station: 'forge', desc: '철광석 2 → 구리 반지' },
  // 요리
  { id: 'potion', out: { id: 'potion', qty: 1 }, inputs: [{ id: 'strawberry', qty: 2 }, { id: 'milk', qty: 1 }], station: 'cook', desc: '딸기 2 + 우유 1 → 치유 물약' },
  // --- 가공 체인 (제분/제과/양조/요리 확장) ---
  { id: 'flour', out: { id: 'flour', qty: 1 }, inputs: [{ id: 'wheat', qty: 2 }], station: 'mill', desc: '밀 2 → 밀가루 1' },
  { id: 'cheese', out: { id: 'cheese', qty: 1 }, inputs: [{ id: 'goatMilk', qty: 2 }], station: 'cook', desc: '염소젖 2 → 치즈' },
  { id: 'jam', out: { id: 'jam', qty: 1 }, inputs: [{ id: 'blueberry', qty: 2 }, { id: 'honey', qty: 1 }], station: 'cook', desc: '블루베리 2 + 꿀 1 → 잼' },
  { id: 'salad', out: { id: 'salad', qty: 1 }, inputs: [{ id: 'cabbage', qty: 1 }, { id: 'tomato', qty: 1 }, { id: 'carrot', qty: 1 }], station: 'cook', desc: '양배추+토마토+당근 → 샐러드' },
  { id: 'honeyTea', out: { id: 'honeyTea', qty: 1 }, inputs: [{ id: 'honey', qty: 1 }], station: 'cook', desc: '꿀 1 → 꿀차' },
  { id: 'pumpkinPie', out: { id: 'pumpkinPie', qty: 1 }, inputs: [{ id: 'pumpkin', qty: 1 }, { id: 'flour', qty: 1 }, { id: 'duckEgg', qty: 1 }], station: 'bake', desc: '호박+밀가루+오리알 → 호박파이' },
  { id: 'wine', out: { id: 'wine', qty: 1 }, inputs: [{ id: 'grape', qty: 3 }], station: 'brew', desc: '포도 3 → 와인' },
  { id: 'sashimi', out: { id: 'sashimi', qty: 1 }, inputs: [{ id: 'tuna', qty: 1 }], station: 'cook', desc: '참치 1 → 회' },
  { id: 'greatPotion', out: { id: 'greatPotion', qty: 1 }, inputs: [{ id: 'potion', qty: 1 }, { id: 'ginseng', qty: 1 }, { id: 'crystal', qty: 1 }], station: 'cook', desc: '치유물약+인삼+마력수정 → 상급 물약' },
];

// 통합 보유량 조회 (wood/stone 은 자원 필드)
export function itemCount(state, id) {
  if (id === 'wood') return state.wood;
  if (id === 'stone') return state.stone;
  if (id === 'feed') return state.feed;
  return state.inventory[id] || 0;
}

export function canCraft(state, recipe) {
  return recipe.inputs.every((i) => itemCount(state, i.id) >= i.qty);
}
