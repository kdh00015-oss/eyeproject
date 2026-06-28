// 게임 핵심 로직: 통계 계산, 시간 진행(tick), 건설/철거

import {
  BUILDINGS,
  BASE_MAX_POP,
  FOOD_PER_POP,
  POP_GROWTH,
  GROWTH_FOOD_THRESHOLD,
  STARVE_RATE,
  DEMOLISH_REFUND,
} from './config';

// 현재 상태로부터 파생 통계를 계산한다.
export function computeStats(state) {
  let maxPop = BASE_MAX_POP;
  let workersNeeded = 0;
  const gross = { gold: 0, wood: 0, food: 0 };

  for (const cell of state.grid) {
    if (!cell) continue;
    const b = BUILDINGS[cell];
    if (!b) continue;
    maxPop += b.maxPop;
    workersNeeded += b.workers;
    for (const [res, amt] of Object.entries(b.produces)) {
      gross[res] += amt;
    }
  }

  const workersAvailable = Math.floor(state.population);
  const efficiency =
    workersNeeded > 0 ? Math.min(1, workersAvailable / workersNeeded) : 1;

  // 일꾼 효율을 반영한 실제 생산량
  const production = {
    gold: gross.gold * efficiency,
    wood: gross.wood * efficiency,
    food: gross.food * efficiency,
  };

  const foodUpkeep = state.population * FOOD_PER_POP;

  // 화면에 표시할 순증감(초당)
  const net = {
    gold: production.gold,
    wood: production.wood,
    food: production.food - foodUpkeep,
  };

  return {
    maxPop,
    workersNeeded,
    workersAvailable,
    efficiency,
    production,
    foodUpkeep,
    net,
  };
}

// dt초만큼 시간을 진행시킨다. (불변성 유지: 새 상태 반환)
export function tick(state, dt = 1) {
  const stats = computeStats(state);
  const resources = { ...state.resources };

  resources.gold = Math.max(0, resources.gold + stats.net.gold * dt);
  resources.wood = Math.max(0, resources.wood + stats.net.wood * dt);
  resources.food = resources.food + stats.net.food * dt;

  let population = state.population;

  if (resources.food < 0) {
    // 식량 부족 → 굶주림으로 인구 감소
    resources.food = 0;
    population = Math.max(0, population - STARVE_RATE * dt);
  } else if (
    population < stats.maxPop &&
    resources.food >= GROWTH_FOOD_THRESHOLD
  ) {
    // 식량이 충분하고 거주 공간이 남으면 인구 성장
    population = Math.min(stats.maxPop, population + POP_GROWTH * dt);
  }

  return { ...state, resources, population };
}

// 비용을 감당할 수 있는지 확인
export function canAfford(resources, cost) {
  return Object.entries(cost).every(([res, amt]) => resources[res] >= amt);
}

// 건물 건설: 성공 시 새 상태, 실패 시 null
export function placeBuilding(state, index, buildingId) {
  const building = BUILDINGS[buildingId];
  if (!building) return null;
  if (state.grid[index]) return null; // 이미 점유됨
  if (!canAfford(state.resources, building.cost)) return null;

  const resources = { ...state.resources };
  for (const [res, amt] of Object.entries(building.cost)) {
    resources[res] -= amt;
  }
  const grid = state.grid.slice();
  grid[index] = buildingId;

  return { ...state, resources, grid };
}

// 건물 철거: 비용 일부 환급
export function demolishBuilding(state, index) {
  const buildingId = state.grid[index];
  if (!buildingId) return null;
  const building = BUILDINGS[buildingId];

  const resources = { ...state.resources };
  for (const [res, amt] of Object.entries(building.cost)) {
    resources[res] += Math.floor(amt * DEMOLISH_REFUND);
  }
  const grid = state.grid.slice();
  grid[index] = null;

  return { ...state, resources, grid };
}
