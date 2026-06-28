// localStorage 저장/불러오기 — 3개 세이브 슬롯 지원

import { createInitialState } from './initialState';

export const SLOTS = [0, 1, 2];
const slotKey = (i) => `village-sim-slot-${i}`;
const CUR = 'village-sim-current-slot';
const LEGACY = 'village-sim-save-v2';

function mergeBase(data) {
  const base = createInitialState();
  return {
    ...base,
    ...data,
    buildings: { ...base.buildings, ...data.buildings },
    research: { ...base.research, ...data.research },
    livestock: { ...base.livestock, ...data.livestock },
    inventory: { ...base.inventory, ...data.inventory },
    prices: { ...base.prices, ...data.prices },
    workers: Array.isArray(data.workers) ? data.workers : base.workers,
    stats: { ...base.stats, ...data.stats },
    dailyBase: { ...base.dailyBase, ...data.dailyBase },
    claimed: Array.isArray(data.claimed) ? data.claimed : [],
    equipped: Array.isArray(data.equipped) ? data.equipped : [],
    satisfaction: { ...base.satisfaction, ...data.satisfaction },
  };
}

export function getCurrentSlot() {
  try { const v = localStorage.getItem(CUR); return v != null ? Number(v) : 0; } catch { return 0; }
}
export function setCurrentSlot(i) { try { localStorage.setItem(CUR, String(i)); } catch { /* 무시 */ } }

export function saveSlot(state, slot) {
  try {
    localStorage.setItem(slotKey(slot), JSON.stringify({ ...state, _savedAt: Date.now() }));
    setCurrentSlot(slot);
    return true;
  } catch { return false; }
}
export function loadSlot(slot) {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    return mergeBase(JSON.parse(raw));
  } catch { return null; }
}
export function slotMeta(slot) {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { day: d.day, money: Math.floor(d.money), level: d.level || 1, pop: Math.floor(d.population || 0), savedAt: d._savedAt };
  } catch { return null; }
}

// 현재 슬롯(없으면 레거시 단일 저장본) 불러오기
export function loadCurrent() {
  const slot = getCurrentSlot();
  const s = loadSlot(slot);
  if (s) return { state: s, slot };
  if (slot === 0) {
    try {
      const raw = localStorage.getItem(LEGACY);
      if (raw) return { state: mergeBase(JSON.parse(raw)), slot: 0 };
    } catch { /* 무시 */ }
  }
  return { state: createInitialState(), slot };
}
