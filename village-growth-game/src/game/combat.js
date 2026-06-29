// 전투/사냥: 장비 슬롯, 플레이어 능력치, 사냥 지역·몬스터, 드롭

import { itemDef } from './items';

// 장비 슬롯
export const GEAR_SLOTS = [
  { id: 'weapon', name: '무기', icon: '⚔️' },
  { id: 'armor', name: '갑옷', icon: '🛡️' },
  { id: 'helmet', name: '투구', icon: '⛑️' },
  { id: 'gloves', name: '장갑', icon: '🧤' },
  { id: 'boots', name: '신발', icon: '🥾' },
  { id: 'necklace', name: '목걸이', icon: '📿' },
  { id: 'ring', name: '반지', icon: '💍' },
  { id: 'tool', name: '도구', icon: '🪓' },
];

// 장착 인스턴스의 강화 배율
function enhMult(enh) { return 1 + (enh || 0) * 0.2; }

// 플레이어 전투 능력치 (레벨 + 장비)
export function playerStats(state) {
  let atk = 5 + state.level * 1;
  let def = 0;
  let hpMax = 50 + state.level * 8;
  for (const slot of GEAR_SLOTS) {
    if (slot.id === 'tool') continue;
    const inst = state.gear[slot.id];
    if (!inst || inst.dur <= 0) continue; // 망가진 장비는 효과 없음
    const d = itemDef(inst.id);
    const m = enhMult(inst.enh);
    atk += Math.round((d.atk || 0) * m);
    def += Math.round((d.def || 0) * m);
    hpMax += d.hp || 0;
  }
  return { atk, def, hpMax };
}

// 강화 (확률 기반: 성공 시 +1, 실패 시 일정 단계부터 -1 하락)
export const MAX_ENHANCE = 10;
export function enhanceCost(enh) { return { gold: 50 + enh * 60, crystal: 1 + enh }; }
// 성공 확률: +0 → 90%, 단계마다 -10%p, 최저 15%
export function enhanceChance(enh) { return Math.max(0.15, 0.9 - enh * 0.1); }
// 실패 시 강화 단계 하락 여부: +4 이상부터 실패하면 한 단계 떨어짐
export function enhanceDowngrades(enh) { return enh >= 4; }
export function repairCost(def, dur) { return Math.ceil(((def.maxDur || 40) - dur) * 1.5) + 10; }

// --- 몬스터 & 사냥 지역 ---
function mon(id, name, icon, hp, atk, def, exp, gold, drops, boss) {
  return { id, name, icon, hp, atk, def, exp, gold, drops, boss: !!boss };
}

export const ZONES = [
  {
    id: 'forest', name: '숲', icon: '🌲', unlock: 1,
    monsters: [
      mon('slime', '슬라임', '🟢', 30, 6, 0, 12, 8, [{ id: 'hide', qty: 1, chance: 0.5 }]),
      mon('wolf', '늑대', '🐺', 45, 10, 2, 18, 12, [{ id: 'hide', qty: 2, chance: 0.6 }, { id: 'bone', qty: 1, chance: 0.3 }]),
    ],
    boss: mon('boarKing', '멧돼지 왕', '🐗', 140, 16, 4, 80, 60, [{ id: 'leatherArmor', qty: 1, chance: 0.5 }, { id: 'hide', qty: 4, chance: 1 }], true),
  },
  {
    id: 'cave', name: '동굴', icon: '🕳️', unlock: 3,
    monsters: [
      mon('bat', '박쥐', '🦇', 55, 14, 2, 26, 16, [{ id: 'bone', qty: 2, chance: 0.5 }]),
      mon('spider', '독거미', '🕷️', 70, 18, 4, 34, 22, [{ id: 'oreIron', qty: 1, chance: 0.5 }, { id: 'bone', qty: 1, chance: 0.4 }]),
    ],
    boss: mon('caveTroll', '동굴 트롤', '👹', 280, 26, 8, 160, 140, [{ id: 'ironSword', qty: 1, chance: 0.4 }, { id: 'oreIron', qty: 5, chance: 1 }, { id: 'crystal', qty: 1, chance: 0.5 }], true),
  },
  {
    id: 'ruins', name: '폐허', icon: '🏚️', unlock: 5,
    monsters: [
      mon('skeleton', '해골 병사', '💀', 95, 24, 6, 46, 30, [{ id: 'oreIron', qty: 2, chance: 0.5 }, { id: 'bone', qty: 3, chance: 0.6 }]),
      mon('wraith', '망령', '👻', 110, 30, 8, 58, 40, [{ id: 'crystal', qty: 1, chance: 0.4 }]),
    ],
    boss: mon('ruinKnight', '폐허의 기사', '🩻', 480, 40, 14, 320, 280, [{ id: 'plateArmor', qty: 1, chance: 0.4 }, { id: 'crystal', qty: 3, chance: 1 }], true),
  },
  {
    id: 'temple', name: '고대 신전', icon: '🏛️', unlock: 8,
    monsters: [
      mon('gargoyle', '가고일', '🗿', 160, 42, 12, 80, 60, [{ id: 'crystal', qty: 2, chance: 0.5 }, { id: 'oreIron', qty: 3, chance: 0.5 }]),
      mon('golem', '골렘', '🪨', 220, 50, 18, 110, 80, [{ id: 'crystal', qty: 3, chance: 0.6 }]),
    ],
    boss: mon('guardian', '고대 수호자', '😈', 900, 64, 24, 700, 600, [{ id: 'knightBlade', qty: 1, chance: 0.5 }, { id: 'rubyAmulet', qty: 1, chance: 0.4 }, { id: 'crystal', qty: 6, chance: 1 }], true),
  },
  {
    id: 'volcano', name: '화산 동굴', icon: '🌋', unlock: 11,
    monsters: [
      mon('lavaLizard', '용암 도마뱀', '🦎', 260, 72, 20, 150, 110, [{ id: 'oreIron', qty: 4, chance: 0.6 }, { id: 'steel', qty: 1, chance: 0.4 }]),
      mon('magmaGolem', '마그마 골렘', '🟥', 340, 84, 28, 200, 150, [{ id: 'steel', qty: 2, chance: 0.5 }, { id: 'crystal', qty: 2, chance: 0.5 }]),
    ],
    boss: mon('fireDrake', '화염 비룡', '🐉', 1500, 100, 36, 1200, 1000, [{ id: 'dragonScale', qty: 2, chance: 0.6 }, { id: 'mythril', qty: 2, chance: 0.7 }, { id: 'crystal', qty: 8, chance: 1 }], true),
  },
  {
    id: 'glacier', name: '빙하 협곡', icon: '🧊', unlock: 14,
    monsters: [
      mon('frostWolf', '서리 늑대', '🐺', 380, 110, 30, 240, 170, [{ id: 'mythril', qty: 1, chance: 0.4 }, { id: 'hide', qty: 4, chance: 0.7 }]),
      mon('iceSpirit', '얼음 정령', '🧚', 440, 124, 40, 300, 220, [{ id: 'crystal', qty: 3, chance: 0.6 }, { id: 'mythril', qty: 1, chance: 0.5 }]),
    ],
    boss: mon('frostGiant', '빙하 거인', '🥶', 2200, 140, 50, 1800, 1500, [{ id: 'mythrilBlade', qty: 1, chance: 0.5 }, { id: 'mythril', qty: 3, chance: 0.8 }, { id: 'crystal', qty: 10, chance: 1 }], true),
  },
  {
    id: 'abyss', name: '심연', icon: '🕯️', unlock: 18,
    monsters: [
      mon('shadowHunter', '그림자 사냥꾼', '👤', 600, 170, 56, 420, 320, [{ id: 'mythril', qty: 2, chance: 0.5 }, { id: 'crystal', qty: 4, chance: 0.6 }]),
      mon('voidBeast', '공허 야수', '🦑', 720, 196, 68, 520, 400, [{ id: 'dragonScale', qty: 1, chance: 0.4 }, { id: 'crystal', qty: 5, chance: 0.7 }]),
    ],
    boss: mon('abyssLord', '심연의 군주', '👹', 3600, 230, 84, 3200, 2800, [{ id: 'dragonPlate', qty: 1, chance: 0.5 }, { id: 'dragonScale', qty: 3, chance: 0.8 }, { id: 'crystal', qty: 16, chance: 1 }], true),
  },
];

export function zoneById(id) { return ZONES.find((z) => z.id === id); }

// 드롭 정산
export function rollDrops(monster) {
  const items = [];
  for (const d of monster.drops || []) if (Math.random() < d.chance) items.push({ id: d.id, qty: d.qty });
  return items;
}
