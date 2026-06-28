// 게임 핵심 엔진: 파생 통계 계산 + 하루 진행(advanceDay)

import {
  SEASONS,
  DAYS_PER_SEASON,
  WEATHER_TABLE,
  RANKS,
  VILLAGE_GRADES,
  VILLAGE_TEMPLATES,
  FOOD_PER_POP,
  TAX_PER_POP,
  MAX_LOG,
} from './constants';
import { BUILDINGS } from './buildings';
import { ANIMALS } from './livestock';
import { GOODS, EDIBLE_IDS } from './goods';
import { RESEARCH_FIELDS } from './research';
import { clamp, weightedPick } from './util';

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

  const maxPop = 5 + b.house * 4;
  const storageCap = 100 + b.warehouse * 60;
  const marketBonus = b.market * 0.06;
  const commerceBonus = r.commerce * 0.08;
  const sellMult = 1 + marketBonus + commerceBonus;
  const tradeMult = 1 + b.port * 0.08 + commerceBonus;
  const seaUnlocked = b.port >= 1;
  const researchEnabled = b.lab >= 1;
  const researchDiscount = b.lab * 0.05;
  const schoolHappiness = b.school * 4 + r.admin * 3;

  const buildingLevels = Object.values(b).reduce((s, v) => s + v, 0);
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
  };
}

// 현재 판매 단가 (시장 가격 변동 × 판매 보너스)
export function sellPrice(state, goodId, derived) {
  const d = derived || computeDerived(state);
  const base = state.prices[goodId] ?? GOODS[goodId].basePrice;
  return Math.max(1, Math.round(base * d.sellMult));
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
  };
  let log = state.log;
  const day = state.day + 1;
  next.day = day;

  // 벌목/채굴된 자연물 respawn (나무 8일, 바위 12일 후 복구)
  const RESPAWN = { tree: 8, rock: 12 };
  next.removed = state.removed.filter((r) => day - r.day < (RESPAWN[r.type] || 8));

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

  // 2) 축산: 사료 소비 + 생산
  let feed = state.feed;
  const livestockBonus = 1 + state.research.livestock * 0.1;
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

  // 3) 주민 식량 소비 (인벤토리의 식용 재화에서 차감)
  let foodNeed = state.population * FOOD_PER_POP;
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

  // 4) 행복도 갱신 (목표치로 서서히 이동)
  let target = 55 + derived.schoolHappiness - state.taxRate;
  if (foodShort) target -= 30;
  if (state.population > derived.maxPop) target -= 15; // 과밀
  target = clamp(target, 0, 100);
  let happiness = state.happiness + (target - state.happiness) * 0.3;
  happiness = clamp(happiness, 0, 100);
  next.happiness = happiness;
  if (foodShort) {
    log = pushLog(log, day, '🍽️ 식량이 부족합니다! 주민 행복도가 떨어집니다.', 'warn');
  }

  // 5) 인구 변화
  let population = state.population;
  if (happiness >= 60 && population < derived.maxPop && !foodShort) {
    population += 0.05 + ((happiness - 60) / 40) * 0.15;
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

  // 7) 교역 수입 + 영향력
  let tradeIncome = 0;
  let influenceGain = 0;
  for (const v of state.villages) {
    if (!v.tradeOpen) continue;
    const tpl = VILLAGE_TEMPLATES.find((t) => t.id === v.id);
    tradeIncome += tpl.tradeIncome * derived.tradeMult;
    influenceGain += tpl.influence * 0.05;
  }

  next.money = state.money + tax + tradeIncome;
  next.influence = state.influence + influenceGain;

  // 8) 시장 가격 변동 (기본가의 0.6~1.5 사이에서 랜덤 워크)
  const prices = next.prices;
  for (const g of Object.values(GOODS)) {
    const base = g.basePrice;
    const cur = prices[g.id] ?? base;
    const drift = cur * (0.92 + Math.random() * 0.16); // ±8% 변동
    const pulled = drift + (base - drift) * 0.1; // 기본가로 약하게 회귀
    prices[g.id] = clamp(Math.round(pulled), Math.round(base * 0.6), Math.round(base * 1.5));
  }

  // 9) 직위 자동 승급
  const newDerived = computeDerived(next);
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
