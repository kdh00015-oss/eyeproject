// localStorage 저장/불러오기

import { createInitialState } from './initialState';

export const SAVE_KEY = 'village-sim-save-v2';

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // 누락 필드 방어: 기본 상태와 병합
    const base = createInitialState();
    return {
      ...base,
      ...data,
      buildings: { ...base.buildings, ...data.buildings },
      research: { ...base.research, ...data.research },
      livestock: { ...base.livestock, ...data.livestock },
      inventory: { ...base.inventory, ...data.inventory },
      prices: { ...base.prices, ...data.prices },
    };
  } catch {
    return null;
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 무시
  }
}
