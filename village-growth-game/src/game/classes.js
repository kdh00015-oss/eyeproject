// 시작 직업: 게임 시작 시 선택. 시작 아이템 + 지속 보너스 + 숙련 시작.
//  '언제든 변경'이 아니라 플레이로 다른 분야를 익혀가는 출발점.

export const CLASSES = {
  farmer: { id: 'farmer', name: '농부', icon: '🧑‍🌾', perks: ['씨앗·작은 밭 지급', '작물 성장 +10%', '농업 숙련 시작'] },
  fisher: { id: 'fisher', name: '어부', icon: '🎣', perks: ['생선 일부 지급', '생선 판매가 +10%', '어업 숙련 시작'] },
  rancher: { id: 'rancher', name: '목축업자', icon: '🐔', perks: ['닭 2마리·사료', '축산물 +10%', '축산 숙련 시작'] },
  forager: { id: 'forager', name: '채집꾼', icon: '🪓', perks: ['강화 도끼·곡괭이', '벌목·채광량 증가', '벌목/채광 숙련 시작'] },
  merchant: { id: 'merchant', name: '상인', icon: '💰', perks: ['시작 골드 +400', '판매가 +6% / 구매 -10%', '상업 숙련 시작'] },
};
export const CLASS_LIST = Object.values(CLASSES);

// 직업별 지속 보너스 (기본값 포함 → 호출부에서 분기 불필요)
export function cbonus(state) {
  const id = (state && state.class) || 'none';
  const base = { cropGrow: 1, fishSell: 1, livestock: 1, chop: 0, mine: 0, sell: 1, buy: 1 };
  switch (id) {
    case 'farmer': return { ...base, cropGrow: 0.9 };
    case 'fisher': return { ...base, fishSell: 1.1 };
    case 'rancher': return { ...base, livestock: 1.1 };
    case 'forager': return { ...base, chop: 1, mine: 1 };
    case 'merchant': return { ...base, sell: 1.06, buy: 0.9 };
    default: return base;
  }
}

// 시작 보너스 적용 (createInitialState 내부에서 호출, state 변형)
export function applyClass(state, id) {
  state.class = id || 'none';
  const SEED = 600; // 시작 숙련 경험치(≈Lv6)
  if (id === 'farmer') {
    state.skills.farming += SEED;
    state.farm[0] = { cropId: 'wheat', plantedDay: 1 };
    state.farm[1] = { cropId: 'potato', plantedDay: 1 };
    state.inventory.wheat = (state.inventory.wheat || 0) + 3;
  } else if (id === 'fisher') {
    state.skills.fishing += SEED;
    state.inventory.crucian = (state.inventory.crucian || 0) + 4;
  } else if (id === 'rancher') {
    state.skills.livestock += SEED;
    state.livestock.chicken.count = 2;
    state.feed += 40;
  } else if (id === 'forager') {
    state.skills.foraging += SEED;
    state.skills.mining += Math.floor(SEED / 2);
    state.inventory.sturdyAxe = (state.inventory.sturdyAxe || 0) + 1;
    state.inventory.sturdyPick = (state.inventory.sturdyPick || 0) + 1;
  } else if (id === 'merchant') {
    state.skills.trade += SEED;
    state.money += 400;
  }
  return state;
}
