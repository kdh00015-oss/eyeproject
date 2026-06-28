// 중앙 게임 훅: 상태(reducer) + 시간 진행 루프 + 저장/불러오기(슬롯) + 행동 디스패치

import { useReducer, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { gameReducer } from '../game/reducer';
import { createInitialState } from '../game/initialState';
import { computeDerived, seasonInfo } from '../game/engine';
import { loadCurrent, loadSlot, saveSlot, setCurrentSlot } from '../game/storage';

export const SPEEDS = [
  { id: 'pause', label: '⏸ 정지', ms: 0 },
  { id: 'x1', label: '▶ 1배속', ms: 2000 },
  { id: 'x2', label: '⏩ 2배속', ms: 1000 },
];

const boot = loadCurrent();

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => boot.state);
  const [speedId, setSpeedId] = useState('pause');
  const [slot, setSlot] = useState(boot.slot);
  const slotRef = useRef(slot); slotRef.current = slot;
  const [slotTick, setSlotTick] = useState(0); // 슬롯 메타 갱신 트리거

  const speed = SPEEDS.find((s) => s.id === speedId);
  useEffect(() => {
    if (!speed || speed.ms === 0) return undefined;
    const id = setInterval(() => dispatch({ type: 'NEXT_DAY' }), speed.ms);
    return () => clearInterval(id);
  }, [speed]);

  // 현재 슬롯에 자동 저장
  useEffect(() => { saveSlot(state, slotRef.current); }, [state]);

  const derived = useMemo(() => computeDerived(state), [state]);
  const time = useMemo(() => seasonInfo(state.day), [state.day]);

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
      buyGood: (goodId, qty) => dispatch({ type: 'BUY_GOOD', goodId, qty }),
      buyFeed: (qty) => dispatch({ type: 'BUY_FEED', qty }),
      upgradeRanch: () => dispatch({ type: 'UPGRADE_RANCH' }),
      build: (buildingId) => dispatch({ type: 'BUILD', buildingId }),
      chop: (key) => dispatch({ type: 'CHOP', key }),
      mine: (key) => dispatch({ type: 'MINE', key }),
      place: (ptype, x, y, map) => dispatch({ type: 'PLACE', ptype, x, y, map }),
      removePlaced: (x, y, map) => dispatch({ type: 'REMOVE_PLACED', x, y, map }),
      research: (field) => dispatch({ type: 'RESEARCH', field }),
      explore: () => dispatch({ type: 'EXPLORE' }),
      openTrade: (villageId) => dispatch({ type: 'OPEN_TRADE', villageId }),
      hire: (job) => dispatch({ type: 'HIRE', job }),
      fireWorker: (id) => dispatch({ type: 'FIRE_WORKER', id }),
      recruitGeneral: () => dispatch({ type: 'RECRUIT_GENERAL' }),
      dismissGeneral: (id) => dispatch({ type: 'DISMISS_GENERAL', id }),
      recruitTroop: (troop, qty) => dispatch({ type: 'RECRUIT_TROOP', troop, qty }),
      disbandTroop: (troop, qty) => dispatch({ type: 'DISBAND_TROOP', troop, qty }),
      attackVillage: (id) => dispatch({ type: 'ATTACK_VILLAGE', id }),
      craft: (id) => dispatch({ type: 'CRAFT', id }),
      useItem: (id) => dispatch({ type: 'USE_ITEM', id }),
      equip: (id) => dispatch({ type: 'EQUIP', id }),
      unequip: (slot) => dispatch({ type: 'UNEQUIP', slot }),
      enhance: (slot) => dispatch({ type: 'ENHANCE', slot }),
      repair: (slot) => dispatch({ type: 'REPAIR', slot }),
      combatResult: (payload) => dispatch({ type: 'COMBAT_RESULT', ...payload }),
      claimQuest: (id) => dispatch({ type: 'CLAIM_QUEST', id }),
      setTax: (rate) => dispatch({ type: 'SET_TAX', rate }),
      visitMap: (map) => dispatch({ type: 'VISIT_MAP', map }),
      newGame: (cls) => dispatch({ type: 'NEW_GAME', class: cls }),
    }),
    []
  );

  // 슬롯 저장/불러오기
  const saveToSlot = useCallback((i) => { saveSlot(state, i); setSlot(i); setSlotTick((t) => t + 1); }, [state]);
  const loadFromSlot = useCallback((i) => {
    const s = loadSlot(i);
    if (s) { dispatch({ type: 'LOAD', state: s }); setSlot(i); setCurrentSlot(i); }
  }, []);
  const newGameInSlot = useCallback((i, cls) => {
    const fresh = createInitialState(cls);
    dispatch({ type: 'LOAD', state: fresh });
    saveSlot(fresh, i); setSlot(i); setSlotTick((t) => t + 1);
  }, []);

  const save = useCallback(() => { saveSlot(state, slotRef.current); setSlotTick((t) => t + 1); }, [state]);

  return { state, derived, time, actions, speedId, setSpeedId, save, slot, saveToSlot, loadFromSlot, newGameInSlot, slotTick };
}
