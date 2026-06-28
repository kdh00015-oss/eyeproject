// 게임 상태 관리 훅: tick 루프, 저장/불러오기, 건설/철거/채집 액션

import { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_STATE, SAVE_KEY, TICK_MS } from '../game/config';
import {
  tick,
  computeStats,
  placeBuilding,
  demolishBuilding,
} from '../game/engine';

function freshState() {
  // 깊은 복사로 초기 상태 생성 (grid 배열 공유 방지)
  return {
    resources: { ...INITIAL_STATE.resources },
    population: INITIAL_STATE.population,
    grid: INITIAL_STATE.grid.slice(),
  };
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.grid)) return null;
    return data;
  } catch {
    return null;
  }
}

export function useVillage() {
  const [state, setState] = useState(() => loadSaved() || freshState());
  const [savedAt, setSavedAt] = useState(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 시간 진행 루프
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => tick(s, TICK_MS / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // 자동 저장 (상태가 바뀔 때마다)
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패는 무시
    }
  }, [state]);

  const stats = computeStats(state);

  // --- 액션들 ---

  const gather = useCallback((res, amount = 1) => {
    setState((s) => ({
      ...s,
      resources: { ...s.resources, [res]: s.resources[res] + amount },
    }));
  }, []);

  const build = useCallback((index, buildingId) => {
    setState((s) => placeBuilding(s, index, buildingId) || s);
  }, []);

  const demolish = useCallback((index) => {
    setState((s) => demolishBuilding(s, index) || s);
  }, []);

  const saveNow = useCallback(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
      setSavedAt(Date.now());
    } catch {
      // 무시
    }
  }, []);

  const newGame = useCallback(() => {
    const fresh = freshState();
    setState(fresh);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(fresh));
    } catch {
      // 무시
    }
    setSavedAt(null);
  }, []);

  return { state, stats, gather, build, demolish, saveNow, newGame, savedAt };
}
