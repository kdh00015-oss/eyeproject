// 제작(Crafting) 레시피
//  inputs/out 의 id는 아이템 id (wood/stone 은 자원 필드, 그 외는 인벤토리)

export const RECIPES = [
  { id: 'plank', out: { id: 'plank', qty: 1 }, inputs: [{ id: 'wood', qty: 3 }], desc: '목재 3 → 판자 1' },
  { id: 'block', out: { id: 'block', qty: 1 }, inputs: [{ id: 'stone', qty: 3 }], desc: '돌 3 → 석재블록 1' },
  { id: 'bread', out: { id: 'bread', qty: 1 }, inputs: [{ id: 'wheat', qty: 2 }], desc: '밀 2 → 빵 1' },
  { id: 'feast', out: { id: 'feast', qty: 1 }, inputs: [{ id: 'bread', qty: 2 }, { id: 'milk', qty: 1 }], desc: '빵 2 + 우유 1 → 잔칫상 1' },
  { id: 'sturdyAxe', out: { id: 'sturdyAxe', qty: 1 }, inputs: [{ id: 'plank', qty: 3 }, { id: 'block', qty: 1 }], desc: '판자 3 + 블록 1 → 강화 도끼' },
  { id: 'sturdyPick', out: { id: 'sturdyPick', qty: 1 }, inputs: [{ id: 'plank', qty: 1 }, { id: 'block', qty: 3 }], desc: '판자 1 + 블록 3 → 강화 곡괭이' },
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
