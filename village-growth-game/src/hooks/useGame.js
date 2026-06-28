// 중앙 게임 훅: 상태(reducer) + 시간 진행 루프 + 저장/불러오기 + 행동 디스패치

import { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { gameReducer } from '../game/reducer';
import { createInitialState } from '../game/initialState';
import { computeDerived, seasonInfo } from '../game/engine';
import { loadGame, saveGame } from '../game/storage';

// 재생 속도 (ms per day)
export const SPEEDS = [
  { id: 'pause', label: '⏸ 정지', ms: 0 },
  { id: 'x1', label: '▶ 1배속', ms: 2000 },
  { id: 'x2', label: '⏩ 2배속', ms: 1000 },
  { id: 'x3', label: '⏭ 3배속', ms: 450 },
];

function init() {
  return loadGame() || createInitialState();
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const [speedId, setSpeedId] = useState('pause');

  // 시간 진행 루프
  const speed = SPEEDS.find((s) => s.id === speedId);
  useEffect(() => {
    if (!speed || speed.ms === 0) return undefined;
    const id = setInterval(() => dispatch({ type: 'NEXT_DAY' }), speed.ms);
    return () => clearInterval(id);
  }, [speed]);

  // 자동 저장 (상태 변화 시)
  useEffect(() => {
    saveGame(state);
  }, [state]);

  // 파생 통계 / 시간 정보 (state 변화 시 재계산)
  const derived = useMemo(() => computeDerived(state), [state]);
  const time = useMemo(() => seasonInfo(state.day), [state.day]);

  // 행동 헬퍼들
  const actions = useMemo(
    () => ({
      nextDay: () => dispatch({ type: 'NEXT_DAY' }),
      plant: (plotIndex, cropId) => dispatch({ type: 'PLANT', plotIndex, cropId }),
      harvest: (plotIndex) => dispatch({ type: 'HARVEST', plotIndex }),
      reclaim: () => dispatch({ type: 'RECLAIM' }),
      fish: (spotId) => dispatch({ type: 'FISH', spotId }),
      buyAnimal: (animalId) => dispatch({ type: 'BUY_ANIMAL', animalId }),
      sellAnimal: (animalId) => dispatch({ type: 'SELL_ANIMAL', animalId }),
      sellGood: (goodId, qty) => dispatch({ type: 'SELL_GOOD', goodId, qty }),
      buyFeed: (qty) => dispatch({ type: 'BUY_FEED', qty }),
      build: (buildingId) => dispatch({ type: 'BUILD', buildingId }),
      research: (field) => dispatch({ type: 'RESEARCH', field }),
      explore: () => dispatch({ type: 'EXPLORE' }),
      openTrade: (villageId) => dispatch({ type: 'OPEN_TRADE', villageId }),
      hire: (job) => dispatch({ type: 'HIRE', job }),
      fireWorker: (id) => dispatch({ type: 'FIRE_WORKER', id }),
      setTax: (rate) => dispatch({ type: 'SET_TAX', rate }),
      newGame: () => dispatch({ type: 'NEW_GAME' }),
    }),
    []
  );

  const save = useCallback(() => saveGame(state), [state]);

  return { state, derived, time, actions, speedId, setSpeedId, save };
}
