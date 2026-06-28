// 게임 핵심 엔진: 파생 통계 계산 + 하루 진행(advanceDay)

import {
  SEASONS,
  DAYS_PER_SEASON,
  WEATHERS,
  WEATHER_TABLE,
  RANKS,
  VILLAGE_GRADES,
  VILLAGE_TEMPLATES,
  FOOD_PER_POP,
  TAX_PER_POP,
  SELL_COMMISSION,
  MAX_LOG,
} from './constants';
import { BUILDINGS } from './buildings';
import { ANIMALS, ranchCap } from './livestock';
import { GOODS, EDIBLE_IDS } from './goods';
import { RESEARCH_FIELDS } from './research';
import { CROPS } from './crops';
import { FISHING_SPOTS } from './fishing';
import {
  JOBS, OUTPUT, levelFromXp, levelMult,
  WORK_FATIGUE, REST_RECOVER, REST_THRESHOLD, REST_BACK, UNPAID_PENALTY,
} from './workers';
import { placedEffects, PLACEABLES } from './world/worldgen';
import { armyUpkeep } from './military';
import { cbonus } from './classes';
import { rollEvent } from './events';
import { newlyAchieved } from './collection';
import { clamp, weightedPick } from './util';

// 생선류 재화 id (어부 판매 보너스 적용 대상)
const FISH_GOODS = new Set(
  Object.values(FISHING_SPOTS).flatMap((s) => s.fish.map((f) => f.id))
);

// 마을 레벨 임계 점수 (index = level-1)
export const VILLAGE_LEVEL_SCORE = [0, 25, 60, 110, 180, 280, 400, 560];
export function villageLevelFromScore(score) {
  let l = 1;
  for (let i = 0; i < VILLAGE_LEVEL_SCORE.length; i++) if (score >= VILLAGE_LEVEL_SCORE[i]) l = i + 1;
  return l;
}

// ---- 시간/계절 ----
export function seasonInfo(day) {
  const total = day - 1;
  const seasonIndex = Math.floor(total / DAYS_PER_SEASON) % SEASONS.length;
  const year = Math.floor(total / (DAYS_PER_SEASON * SEASONS.length)) + 1;
  const dayOfSeason = (total % DAYS_PER_SEASON) + 1;
  return { season: SEASONS[seasonIndex], seasonIndex, year, dayOfSeason };
}

// ---- 파생 통계 (건물/연구 등에서 계산되는 값) ----
export function computeDerived(state) {
  const b = state.buildings;
  const r = state.research;
  const fx = placedEffects(state.placed); // 배치 건물 효과

  const buildingLevelsRaw = Object.values(b).reduce((s, v) => s + v, 0);
  const placedCount = state.placed.length;
  // 마을 레벨 점수
  const vScore = state.population + buildingLevelsRaw * 3 + placedCount * 2 + state.fame * 0.5 + state.influence * 0.3;
  const villageLevel = villageLevelFromScore(vScore);

  const maxPop = 5 + b.house * 4 + fx.maxPop + villageLevel * 2;
  const storageCap = 100 + b.warehouse * 60 + fx.storage;
  const marketBonus = b.market * 0.06;
  const commerceBonus = r.commerce * 0.08;
  const sellMult = 1 + marketBonus + commerceBonus;
  const tradeMult = 1 + b.port * 0.08 + commerceBonus;
  const seaUnlocked = b.port >= 1;
  const researchEnabled = b.lab >= 1;
  const researchDiscount = b.lab * 0.05;
  const schoolHappiness = b.school * 4 + r.admin * 3;

  const buildingLevels = buildingLevelsRaw;
  const researchTotal = Object.values(r).reduce((s, v) => s + v, 0);
  const trades = state.villages.filter((v) => v.tradeOpen).length;

  // 현재 인벤토리 사용량 (저장 한도 대비)
  const stored =
    Object.values(state.inventory).reduce((s, v) => s + v, 0) + state.feed;

  // 마을 등급 점수
  const score =
    state.population + buildingLevels * 3 + state.influence * 0.5;
  let grade = VILLAGE_GRADES[0];
  for (const g of VILLAGE_GRADES) if (score >= g.min) grade = g;

  return {
    maxPop,
    storageCap,
    sellMult,
    tradeMult,
    seaUnlocked,
    researchEnabled,
    researchDiscount,
    schoolHappiness,
    buildingLevels,
    researchTotal,
    trades,
    stored,
    score,
    grade,
    villageLevel,
    vScore,
    placedFx: fx,
    placedCount,
  };
}

// 현재 판매 단가 (시장 가격 변동 × 판매 보너스)
// 판매 압력 → 수요 계수 (많이 팔린 재화는 일시적으로 가격이 눌림, 최대 -60%)
export function demandFactor(state, goodId) {
  const p = (state.pricePressure && state.pricePressure[goodId]) || 0;
  return 1 - Math.min(0.6, p * 0.03);
}

export function sellPrice(state, goodId, derived) {
  const d = derived || computeDerived(state);
  const base = state.prices[goodId] ?? GOODS[goodId].basePrice;
  const cb = cbonus(state);
  // 상인: 모든 판매가 +6%, 어부: 생선 판매가 +10%
  const classMult = cb.sell * (FISH_GOODS.has(goodId) ? cb.fishSell : 1);
  // 시장 수수료(SELL_COMMISSION) 적용 → 수입 난이도 ↑
  return Math.max(1, Math.round(base * d.sellMult * classMult * demandFactor(state, goodId) * SELL_COMMISSION));
}

// 시장 구매가: 현재 시세에 25% 상점 마진. 상인 직업은 구매가 할인(cbonus.buy)
export function buyPrice(state, goodId) {
  const cur = state.prices[goodId] ?? GOODS[goodId].basePrice;
  return Math.max(1, Math.round(cur * 1.25 * cbonus(state).buy));
}

// 직위 승급 조건 충족 여부
function meetsRank(metrics, req) {
  return Object.entries(req).every(([k, v]) => metrics[k] >= v);
}

// 로그 추가 (최신이 앞)
function pushLog(log, day, text, kind = 'info') {
  return [{ day, text, kind }, ...log].slice(0, MAX_LOG);
}

// ---- 하루 진행 ----
export function advanceDay(state) {
  const next = {
    ...state,
    inventory: { ...state.inventory },
    livestock: {},
    prices: { ...state.prices },
    villages: state.villages,
    dex: { ...(state.dex || {}) },
  };
  let log = state.log;
  const day = state.day + 1;
  next.day = day;
  // 일꾼 급여/씨앗 지출 (마지막 정산에 사용)
  let wagesTotal = 0;
  let workerSeedSpend = 0;

  // 벌목/채굴된 자연물 respawn (나무 8일, 바위 12일 후 복구)
  // 채집한 나무/바위는 일정 일수가 지나면 다시 자라남(리셋)
  const RESPAWN = { tree: 3, rock: 4 };
  next.removed = state.removed.filter((r) => day - r.day < (RESPAWN[r.type] || 3));

  // 일일 퀘스트 리셋: 당일 기준치 갱신 + 일일(d로 시작) 보상기록 초기화
  next.dailyBase = { ...state.stats };
  next.claimed = state.claimed.filter((id) => !id.startsWith('d'));

  const { season } = seasonInfo(day);
  const derived = computeDerived(state);

  // 1) 날씨 결정
  const pick = weightedPick(WEATHER_TABLE[season.id]);
  next.weather = pick.id;
  if (pick.id === 'storm') {
    log = pushLog(log, day, '⛈️ 폭풍이 몰아칩니다. 어획량이 크게 줄어듭니다.', 'warn');
  } else if (pick.id === 'drought') {
    log = pushLog(log, day, '🏜️ 가뭄으로 작물 상태가 좋지 않습니다.', 'warn');
  }

  // 2) 축산: 사료 소비 + 생산 (목축업자 일꾼이 생산량 증대, 숙련도 반영)
  let feed = state.feed;
  let rancherFactor = 1;
  for (const w of state.workers)
    if (w.job === 'rancher' && !w.resting)
      rancherFactor += OUTPUT.rancherBonus * levelMult(levelFromXp(w.xp));
  const livestockBonus = (1 + state.research.livestock * 0.1) * rancherFactor * cbonus(state).livestock;
  let feedShort = false;
  for (const [id, animal] of Object.entries(ANIMALS)) {
    const cell = state.livestock[id];
    const slot = { count: cell.count, prog: cell.prog };
    if (slot.count > 0) {
      const need = slot.count * animal.feedPerDay;
      if (feed >= need) {
        feed -= need;
        slot.prog += 1;
        if (slot.prog >= animal.productDays) {
          slot.prog -= animal.productDays;
          const qty = Math.round(slot.count * animal.productQty * livestockBonus);
          next.inventory[animal.product] =
            (next.inventory[animal.product] || 0) + qty;
          next.dex[animal.product] = true;
        }
      } else {
        feedShort = true; // 사료 부족 → 생산 정지
      }
    }
    next.livestock[id] = slot;
  }
  next.feed = feed;
  if (feedShort) {
    log = pushLog(log, day, '🌿 사료가 부족해 일부 가축이 굶고 있습니다.', 'warn');
  }

  // 2.1) 가축 번식: 같은 종 2마리 이상 + 빈자리 + 사료 있을 때 확률로 새끼
  const ranchMax = ranchCap(state.ranchLevel);
  let animalTotal = Object.values(next.livestock).reduce((s, c) => s + c.count, 0);
  if (next.feed > 0) {
    for (const [id, animal] of Object.entries(ANIMALS)) {
      if (animalTotal >= ranchMax) break;
      const cell = next.livestock[id];
      if (cell.count >= 2 && Math.random() < Math.min(0.25, 0.05 * cell.count)) {
        cell.count += 1; animalTotal += 1;
        log = pushLog(log, day, `${animal.icon} ${animal.name}의 새끼가 태어났습니다!`, 'good');
      }
    }
  }

  // 2.2) 어업 시설(통발/양식장): 매일 물고기 자동 어획 (양식장은 사료 소비)
  let trapFish = 0;
  for (const pl of state.placed) {
    const def = PLACEABLES[pl.type];
    if (!def || !def.dailyFish) continue;
    if (def.feedPerDay) {
      if (next.feed >= def.feedPerDay) next.feed -= def.feedPerDay; else continue;
    }
    for (let i = 0; i < def.dailyFish; i++) {
      const f = weightedPick(FISHING_SPOTS.lake.fish);
      next.inventory[f.id] = (next.inventory[f.id] || 0) + 1;
      next.dex[f.id] = true;
    }
    trapFish += def.dailyFish;
  }
  if (trapFish > 0) {
    log = pushLog(log, day, `🦐 어업 시설에서 물고기 ${trapFish}마리를 얻었습니다.`, 'good');
  }

  // 2.5) 일꾼 자동 노동 (개별 숙련도/행복도/휴식 + 자동 생산 + 연구 효율)
  const totalWorkers = state.workers.length;
  const weather = WEATHERS[pick.id];
  const laborEff = 1 + state.research.admin * 0.05; // 행정 연구 → 노동 효율
  let woodGain = 0, stoneGain = 0, farmerCap = 0;
  const fishCatch = [];
  const nextWorkers = [];
  for (const w of state.workers) {
    wagesTotal += JOBS[w.job].wage;
    const nw = { ...w };
    if (nw.resting) {
      // 휴식: 생산 없음, 행복도 회복
      nw.happiness = Math.min(100, nw.happiness + REST_RECOVER);
      if (nw.happiness >= REST_BACK) nw.resting = false;
    } else {
      const mult = levelMult(levelFromXp(nw.xp));
      if (w.job === 'lumberjack') woodGain += OUTPUT.lumberjackWood * mult * laborEff;
      else if (w.job === 'miner') stoneGain += OUTPUT.minerStone * mult * laborEff;
      else if (w.job === 'fisher') {
        const c = Math.round((OUTPUT.fisherCatch + Math.floor(state.research.fishing / 2)) * mult);
        for (let i = 0; i < c; i++) fishCatch.push(1);
      } else if (w.job === 'farmer') farmerCap += OUTPUT.farmerPlots * mult;
      // 숙련도 상승 + 피로
      const before = levelFromXp(nw.xp);
      nw.xp = nw.xp + 10;
      if (levelFromXp(nw.xp) > before)
        log = pushLog(log, day, `⭐ ${nw.name}의 숙련도가 Lv.${levelFromXp(nw.xp)}로 올랐습니다.`, 'good');
      nw.happiness = Math.max(0, nw.happiness - WORK_FATIGUE);
      if (nw.happiness <= REST_THRESHOLD) {
        nw.resting = true;
        log = pushLog(log, day, `😴 ${nw.name}이(가) 지쳐 휴식에 들어갑니다.`, 'info');
      }
    }
    nextWorkers.push(nw);
  }
  next.workers = nextWorkers;

  if (woodGain > 0) next.wood = (next.wood || 0) + Math.round(woodGain);
  if (stoneGain > 0) next.stone = (next.stone || 0) + Math.round(stoneGain);
  for (let i = 0; i < fishCatch.length; i++) {
    const f = weightedPick(FISHING_SPOTS.lake.fish);
    next.inventory[f.id] = (next.inventory[f.id] || 0) + 1;
  }
  const farmCapInt = Math.floor(farmerCap);
  if (farmCapInt > 0) {
    const farm = state.farm.slice();
    const agri = 1 + state.research.agriculture * 0.1;
    let cap = farmCapInt;
    let harvested = 0;
    for (let i = 0; i < farm.length && cap > 0; i++) {
      const plot = farm[i];
      if (!plot) continue;
      const crop = CROPS[plot.cropId];
      if (day - plot.plantedDay < crop.growthDays) continue;
      const qty = Math.max(1, Math.round(crop.yield * weather.crop * agri));
      next.inventory[crop.id] = (next.inventory[crop.id] || 0) + qty;
      harvested += 1;
      cap -= 1;
      if (crop.seasons.includes(season.id) && state.money - workerSeedSpend >= crop.seedCost) {
        farm[i] = { cropId: plot.cropId, plantedDay: day };
        workerSeedSpend += crop.seedCost;
      } else {
        farm[i] = null;
      }
    }
    next.farm = farm;
    if (harvested > 0)
      log = pushLog(log, day, `🧑‍🌾 농부들이 밭 ${harvested}칸을 자동 수확했습니다.`, 'good');
  }

  // 3) 주민·일꾼 식량 소비 (인벤토리의 식용 재화에서 차감)
  let foodNeed = (state.population + totalWorkers) * FOOD_PER_POP;
  for (const id of EDIBLE_IDS) {
    if (foodNeed <= 0) break;
    const have = next.inventory[id] || 0;
    if (have <= 0) continue;
    const fv = GOODS[id].foodValue;
    const canFeed = have * fv;
    if (canFeed <= foodNeed) {
      next.inventory[id] = 0;
      foodNeed -= canFeed;
    } else {
      const used = Math.ceil(foodNeed / fv);
      next.inventory[id] = have - used;
      foodNeed = 0;
    }
  }
  const foodShort = foodNeed > 0.01;

  // 4) 주민 만족도 세부지표 → 행복도
  const fx = derived.placedFx;
  const sTarget = {
    food: foodShort ? 25 : 82,
    safety: clamp(40 + derived.buildingLevels * 2 + derived.villageLevel * 4 + fx.safety, 0, 100),
    culture: clamp(30 + fx.culture + state.buildings.market * 4 + derived.villageLevel * 2, 0, 100),
    education: clamp(20 + state.buildings.school * 12 + fx.education + state.research.admin * 4, 0, 100),
    hygiene: clamp(35 + fx.hygiene + state.buildings.warehouse * 2 + derived.villageLevel * 2, 0, 100),
  };
  const satisfaction = {};
  for (const k of Object.keys(sTarget)) {
    satisfaction[k] = clamp(state.satisfaction[k] + (sTarget[k] - state.satisfaction[k]) * 0.3, 0, 100);
  }
  next.satisfaction = satisfaction;
  const overall = (satisfaction.food + satisfaction.safety + satisfaction.culture + satisfaction.education + satisfaction.hygiene) / 5;
  let target = overall - state.taxRate;
  if (state.population > derived.maxPop) target -= 15; // 과밀
  target = clamp(target, 0, 100);
  let happiness = clamp(state.happiness + (target - state.happiness) * 0.3, 0, 100);
  next.happiness = happiness;
  if (foodShort) {
    log = pushLog(log, day, '🍽️ 식량이 부족합니다! 주민 행복도가 떨어집니다.', 'warn');
  }

  // 5) 인구 변화
  let population = state.population;
  if (happiness >= 55 && population < derived.maxPop && !foodShort) {
    population += 0.16 + ((happiness - 55) / 45) * 0.42; // 인구 증가 속도 상향
    population = Math.min(population, derived.maxPop);
  } else if (happiness < 35) {
    population = Math.max(0, population - 0.2);
  }
  // 정수로 늘거나 줄 때 알림
  if (Math.floor(population) > Math.floor(state.population)) {
    log = pushLog(log, day, '👶 새로운 주민이 마을에 정착했습니다.', 'good');
  } else if (Math.floor(population) < Math.floor(state.population)) {
    log = pushLog(log, day, '💔 주민이 마을을 떠났습니다.', 'warn');
  }
  next.population = population;

  // 6) 세금 수입
  const adminBonus = 1 + state.research.admin * 0.1;
  const happinessFactor = 0.5 + happiness / 100; // 행복할수록 세수 ↑
  const tax =
    population * (state.taxRate / 100) * TAX_PER_POP * adminBonus * happinessFactor;

  // 7) 교역 수입 + 영향력 (+ 정복 영토 수입, 군대 유지비)
  let tradeIncome = 0;
  let influenceGain = 0;
  for (const v of state.villages) {
    const tpl = VILLAGE_TEMPLATES.find((t) => t.id === v.id);
    if (v.tradeOpen) {
      tradeIncome += tpl.tradeIncome * derived.tradeMult;
      influenceGain += tpl.influence * 0.05;
    }
    if (v.owned) { // 영토는 추가 수입 + 영향력
      tradeIncome += tpl.tradeIncome * 0.8;
      influenceGain += tpl.influence * 0.12;
    }
  }
  const militaryUpkeep = armyUpkeep(state);

  // 일꾼 급여/씨앗 정산 — 못 주면 행복도 하락 + 이탈
  const gross = state.money + tax + tradeIncome;
  const owed = wagesTotal + workerSeedSpend + militaryUpkeep;
  next.money = Math.max(0, gross - owed);
  if (owed > gross && totalWorkers > 0) {
    next.workers = next.workers.map((w) => ({
      ...w,
      happiness: Math.max(0, w.happiness - UNPAID_PENALTY),
    }));
    log = pushLog(log, day, '💸 급여가 밀려 일꾼들의 불만이 커집니다.', 'warn');
  }
  // 행복도가 0이 된 일꾼은 마을을 떠남
  const quitters = next.workers.filter((w) => w.happiness <= 0);
  if (quitters.length > 0) {
    next.workers = next.workers.filter((w) => w.happiness > 0);
    log = pushLog(log, day, `🚪 불만이 쌓인 일꾼 ${quitters.length}명이 떠났습니다.`, 'warn');
  }
  next.influence = state.influence + influenceGain;

  // 8) 시장 가격 변동 (수요/공급·계절 반영 랜덤 워크)
  const prices = next.prices;
  const pressure = { ...(state.pricePressure || {}) };
  for (const g of Object.values(GOODS)) {
    const base = g.basePrice;
    const cur = prices[g.id] ?? base;
    const drift = cur * (0.92 + Math.random() * 0.16); // ±8% 변동
    let pulled = drift + (base - drift) * 0.1; // 기본가로 약하게 회귀
    // 계절: 제철이 아닌 작물은 공급이 줄어 가격 ↑ (겨울 작물 희소)
    if (g.category === 'crop') {
      const crop = CROPS[g.id];
      const inSeason = crop && crop.seasons.includes(season.id);
      pulled *= inSeason ? 0.95 : 1.12;
    }
    prices[g.id] = clamp(Math.round(pulled), Math.round(base * 0.55), Math.round(base * 1.6));
    // 판매 압력은 매일 천천히 감쇠(수요 회복이 느림 → 대량 덤핑 비효율)
    if (pressure[g.id]) {
      pressure[g.id] = pressure[g.id] * 0.74;
      if (pressure[g.id] < 0.5) delete pressure[g.id];
    }
  }
  next.pricePressure = pressure;

  // 8.5) 랜덤 이벤트 (낮은 확률로 하루에 한 번)
  const ev = rollEvent(next);
  if (ev) { ev.apply(next); log = pushLog(log, day, ev.text, ev.kind); }

  // 9) 마을 레벨 + 직위 자동 승급
  const newDerived = computeDerived(next);
  next.villageLevel = newDerived.villageLevel;
  if (newDerived.villageLevel > state.villageLevel) {
    log = pushLog(log, day, `🏘️ 마을 레벨 ${newDerived.villageLevel} 달성! 새 건물이 해금되고 수용 인구가 늘었습니다.`, 'good');
  }
  const metrics = {
    population: next.population,
    money: next.money,
    influence: next.influence,
    buildingLevels: newDerived.buildingLevels,
    researchTotal: newDerived.researchTotal,
    trades: newDerived.trades,
  };
  let rankIndex = state.rankIndex;
  while (
    rankIndex + 1 < RANKS.length &&
    meetsRank(metrics, RANKS[rankIndex + 1].req)
  ) {
    rankIndex += 1;
    log = pushLog(
      log,
      day,
      `🎉 직위가 승급했습니다 → ${RANKS[rankIndex].name}!`,
      'good'
    );
  }
  next.rankIndex = rankIndex;

  // 10) 하루 행동 제한 초기화
  next.fishUsed = 0;

  // 10.5) 대시보드용 일별 기록 (최근 150일 롤링)
  next.history = [
    ...(state.history || []),
    { d: day, m: Math.round(next.money), p: Math.floor(next.population), f: Math.round(next.fame || 0), b: newDerived.buildingLevels },
  ].slice(-150);

  // 11) 업적 달성 체크 + 보상 지급 (한 번만)
  const wins = newlyAchieved(next);
  if (wins.length) {
    next.achieved = [...(next.achieved || []), ...wins.map((a) => a.id)];
    for (const a of wins) {
      next.money += a.reward.gold || 0;
      next.fame = (next.fame || 0) + (a.reward.fame || 0);
      const bonus = (a.reward.gold ? ` +${a.reward.gold}G` : '') + (a.reward.fame ? ` +${a.reward.fame}⭐` : '');
      log = pushLog(log, day, `🏆 업적 달성: ${a.icon} ${a.name}!${bonus}`, 'good');
    }
  }

  next.log = log;
  return next;
}

// 분야별 연구 효과 헬퍼 (UI 표시에 사용)
export function researchMultiplier(state, field) {
  const lvl = state.research[field] || 0;
  if (field === 'agriculture' || field === 'livestock') return 1 + lvl * 0.1;
  if (field === 'fishing' || field === 'commerce') return 1 + lvl * 0.08;
  return 1 + lvl * 0.1;
}

export { RESEARCH_FIELDS, BUILDINGS };
