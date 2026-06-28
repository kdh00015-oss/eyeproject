// 플레이어 행동 처리 리듀서

import { createInitialState } from './initialState';
import {
  advanceDay,
  computeDerived,
  seasonInfo,
  sellPrice,
} from './engine';
import { CROPS } from './crops';
import { FISHING_SPOTS } from './fishing';
import { ANIMALS } from './livestock';
import { BUILDINGS, buildingCost } from './buildings';
import { RESEARCH_FIELDS, researchCost, MAX_RESEARCH_LEVEL } from './research';
import { WEATHERS } from './constants';
import {
  FARM_PLOTS_MAX,
  RECLAIM_BASE_COST,
  EXPLORE_BASE_COST,
  BASE_FISH_PER_DAY,
  VILLAGE_TEMPLATES,
  MAX_LOG,
} from './constants';
import { weightedPick, clamp } from './util';

function log(state, text, kind = 'info') {
  return [{ day: state.day, text, kind }, ...state.log].slice(0, MAX_LOG);
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'LOAD':
      return action.state;

    case 'NEXT_DAY':
      return advanceDay(state);

    // --- 농업 ---
    case 'PLANT': {
      const { plotIndex, cropId } = action;
      const crop = CROPS[cropId];
      if (state.farm[plotIndex] != null) return state;
      const { season } = seasonInfo(state.day);
      if (!crop.seasons.includes(season.id)) {
        return { ...state, log: log(state, `${crop.name}은(는) ${season.name}에 심을 수 없습니다.`, 'warn') };
      }
      if (state.money < crop.seedCost) {
        return { ...state, log: log(state, '골드가 부족해 파종할 수 없습니다.', 'warn') };
      }
      const farm = state.farm.slice();
      farm[plotIndex] = { cropId, plantedDay: state.day };
      return { ...state, money: state.money - crop.seedCost, farm };
    }

    case 'HARVEST': {
      const { plotIndex } = action;
      const plot = state.farm[plotIndex];
      if (!plot) return state;
      const crop = CROPS[plot.cropId];
      if (state.day - plot.plantedDay < crop.growthDays) return state;
      // 수확량 = 기본 × 날씨 × 농업연구
      const weather = WEATHERS[state.weather];
      const agri = 1 + state.research.agriculture * 0.1;
      const qty = Math.max(1, Math.round(crop.yield * weather.crop * agri));
      const farm = state.farm.slice();
      farm[plotIndex] = null;
      const inventory = { ...state.inventory };
      inventory[crop.id] = (inventory[crop.id] || 0) + qty;
      return {
        ...state,
        farm,
        inventory,
        log: log(state, `🌾 ${crop.name} ${qty}개를 수확했습니다.`, 'good'),
      };
    }

    case 'RECLAIM': {
      // 밭 개간 (칸 추가)
      if (state.farm.length >= FARM_PLOTS_MAX) return state;
      const cost = RECLAIM_BASE_COST * (state.farm.length - 8);
      if (state.money < cost) {
        return { ...state, log: log(state, '골드가 부족해 개간할 수 없습니다.', 'warn') };
      }
      return {
        ...state,
        money: state.money - cost,
        farm: [...state.farm, null],
        log: log(state, '🪓 새로운 밭을 개간했습니다.', 'good'),
      };
    }

    // --- 어업 ---
    case 'FISH': {
      const { spotId } = action;
      const spot = FISHING_SPOTS[spotId];
      if (spot.requires && state.buildings[spot.requires.building] < spot.requires.level) {
        return { ...state, log: log(state, '아직 갈 수 없는 낚시터입니다. (항구 필요)', 'warn') };
      }
      const maxFish = BASE_FISH_PER_DAY + state.research.fishing;
      if (state.fishUsed >= maxFish) {
        return { ...state, log: log(state, '오늘은 더 이상 낚시할 수 없습니다.', 'warn') };
      }
      // 어업연구가 높을수록 희귀 물고기 가중치 상승
      const fishingLvl = state.research.fishing;
      const table = spot.fish.map((f) => ({
        ...f,
        weight: f.rare ? f.weight * (1 + fishingLvl * 0.2) : f.weight,
      }));
      const weather = WEATHERS[state.weather];
      const caught = weightedPick(table);
      // 폭풍 등 날씨로 허탕 가능
      if (Math.random() > weather.fish) {
        return {
          ...state,
          fishUsed: state.fishUsed + 1,
          log: log(state, `🎣 ${spot.name}에서 허탕을 쳤습니다...`, 'info'),
        };
      }
      const inventory = { ...state.inventory };
      inventory[caught.id] = (inventory[caught.id] || 0) + 1;
      return {
        ...state,
        inventory,
        fishUsed: state.fishUsed + 1,
        log: log(
          state,
          `🐟 ${spot.name}에서 ${caught.name}${caught.rare ? ' (희귀!)' : ''}을(를) 낚았습니다.`,
          caught.rare ? 'good' : 'info'
        ),
      };
    }

    // --- 축산 ---
    case 'BUY_ANIMAL': {
      const animal = ANIMALS[action.animalId];
      if (state.money < animal.buyCost) {
        return { ...state, log: log(state, '골드가 부족합니다.', 'warn') };
      }
      const livestock = {
        ...state.livestock,
        [animal.id]: {
          ...state.livestock[animal.id],
          count: state.livestock[animal.id].count + 1,
        },
      };
      return {
        ...state,
        money: state.money - animal.buyCost,
        livestock,
        log: log(state, `${animal.icon} ${animal.name}을(를) 구입했습니다.`, 'good'),
      };
    }

    case 'SELL_ANIMAL': {
      const animal = ANIMALS[action.animalId];
      const cell = state.livestock[animal.id];
      if (cell.count <= 0) return state;
      const refund = Math.round(animal.buyCost * 0.5);
      const livestock = {
        ...state.livestock,
        [animal.id]: { ...cell, count: cell.count - 1 },
      };
      return {
        ...state,
        money: state.money + refund,
        livestock,
        log: log(state, `${animal.name}을(를) ${refund}골드에 처분했습니다.`, 'info'),
      };
    }

    // --- 시장 거래 ---
    case 'SELL_GOOD': {
      const { goodId, qty } = action;
      const have = state.inventory[goodId] || 0;
      const sellQty = Math.min(qty, have);
      if (sellQty <= 0) return state;
      const price = sellPrice(state, goodId);
      const inventory = { ...state.inventory, [goodId]: have - sellQty };
      return {
        ...state,
        inventory,
        money: state.money + price * sellQty,
        log: log(state, `💰 ${goodId} ${sellQty}개를 ${price * sellQty}골드에 판매.`, 'good'),
      };
    }

    case 'BUY_FEED': {
      const qty = action.qty || 10;
      const cost = qty * 2;
      if (state.money < cost) {
        return { ...state, log: log(state, '골드가 부족합니다.', 'warn') };
      }
      return {
        ...state,
        money: state.money - cost,
        feed: state.feed + qty,
        log: log(state, `🌿 사료 ${qty}개를 구입했습니다.`, 'info'),
      };
    }

    // --- 건설/업그레이드 ---
    case 'BUILD': {
      const { buildingId } = action;
      const b = BUILDINGS[buildingId];
      const level = state.buildings[buildingId];
      if (level >= b.maxLevel) return state;
      const cost = buildingCost(buildingId, level);
      if (state.money < cost) {
        return { ...state, log: log(state, '골드가 부족합니다.', 'warn') };
      }
      const buildings = { ...state.buildings, [buildingId]: level + 1 };
      const verb = level === 0 ? '건설' : '업그레이드';
      return {
        ...state,
        money: state.money - cost,
        buildings,
        log: log(state, `${b.icon} ${b.name}을(를) Lv.${level + 1}로 ${verb}했습니다.`, 'good'),
      };
    }

    // --- 연구 ---
    case 'RESEARCH': {
      const { field } = action;
      const derived = computeDerived(state);
      if (!derived.researchEnabled) {
        return { ...state, log: log(state, '연구소(lab)를 먼저 건설하세요.', 'warn') };
      }
      const level = state.research[field];
      if (level >= MAX_RESEARCH_LEVEL) return state;
      const cost = Math.round(researchCost(level) * (1 - derived.researchDiscount));
      if (state.money < cost) {
        return { ...state, log: log(state, '연구비(골드)가 부족합니다.', 'warn') };
      }
      const research = { ...state.research, [field]: level + 1 };
      return {
        ...state,
        money: state.money - cost,
        research,
        log: log(state, `🔬 ${RESEARCH_FIELDS[field].name} Lv.${level + 1} 완료!`, 'good'),
      };
    }

    // --- 교역 ---
    case 'EXPLORE': {
      const discoveredCount = state.villages.filter((v) => v.discovered).length;
      const next = state.villages.find((v) => !v.discovered);
      if (!next) {
        return { ...state, log: log(state, '더 발견할 마을이 없습니다.', 'info') };
      }
      const cost = EXPLORE_BASE_COST * (discoveredCount + 1);
      if (state.money < cost) {
        return { ...state, log: log(state, `탐험 비용(${cost}골드)이 부족합니다.`, 'warn') };
      }
      const tpl = VILLAGE_TEMPLATES.find((t) => t.id === next.id);
      const villages = state.villages.map((v) =>
        v.id === next.id ? { ...v, discovered: true } : v
      );
      return {
        ...state,
        money: state.money - cost,
        villages,
        log: log(state, `🧭 새로운 마을 '${tpl.name}'을(를) 발견했습니다!`, 'good'),
      };
    }

    case 'OPEN_TRADE': {
      const { villageId } = action;
      const v = state.villages.find((x) => x.id === villageId);
      if (!v || !v.discovered || v.tradeOpen) return state;
      if (state.buildings.port < 1) {
        return { ...state, log: log(state, '교역로 개설에는 항구(port)가 필요합니다.', 'warn') };
      }
      const tpl = VILLAGE_TEMPLATES.find((t) => t.id === villageId);
      if (state.money < tpl.openCost) {
        return { ...state, log: log(state, `교역로 개설 비용(${tpl.openCost}골드)이 부족합니다.`, 'warn') };
      }
      const villages = state.villages.map((x) =>
        x.id === villageId ? { ...x, tradeOpen: true } : x
      );
      return {
        ...state,
        money: state.money - tpl.openCost,
        influence: state.influence + tpl.influence,
        villages,
        log: log(state, `🤝 '${tpl.name}'과(와) 교역로를 개설했습니다!`, 'good'),
      };
    }

    // --- 월드: 도구 행동 ---
    case 'CHOP': {
      // 나무 벌목 → 나무 자원
      const gain = 2 + Math.floor(Math.random() * 2);
      return {
        ...state,
        wood: state.wood + gain,
        removed: [...state.removed, { key: action.key, type: 'tree', day: state.day }],
        log: log(state, `🪓 나무를 베어 목재 ${gain}개를 얻었습니다.`, 'good'),
      };
    }
    case 'MINE': {
      // 바위 채굴 → 돌 자원
      const gain = 1 + Math.floor(Math.random() * 2);
      return {
        ...state,
        stone: state.stone + gain,
        removed: [...state.removed, { key: action.key, type: 'rock', day: state.day }],
        log: log(state, `⛏️ 바위를 캐서 돌 ${gain}개를 얻었습니다.`, 'good'),
      };
    }
    case 'PLACE': {
      const { ptype, x, y, cost } = action;
      if (state.wood < cost.wood || state.stone < cost.stone) {
        return { ...state, log: log(state, '자원이 부족합니다. (나무/돌 필요)', 'warn') };
      }
      return {
        ...state,
        wood: state.wood - cost.wood,
        stone: state.stone - cost.stone,
        placed: [...state.placed, { type: ptype, x, y }],
        log: log(state, `🏗️ 구조물을 설치했습니다.`, 'good'),
      };
    }

    // --- 행정 ---
    case 'SET_TAX':
      return { ...state, taxRate: clamp(action.rate, 0, 40) };

    default:
      return state;
  }
}
