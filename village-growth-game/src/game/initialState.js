// 새 게임 초기 상태 생성

import {
  START_MONEY,
  START_POP,
  FARM_PLOTS_START,
  DEFAULT_TAX,
  VILLAGE_TEMPLATES,
} from './constants';
import { ANIMALS } from './livestock';
import { RESEARCH_FIELDS } from './research';
import { BUILDINGS } from './buildings';
import { GOODS } from './goods';

export function createInitialState() {
  // 밭: 각 칸은 비어있음(null) 또는 { cropId, plantedDay }
  const farm = Array(FARM_PLOTS_START).fill(null);

  // 가축: 종류별 { count, prog(생산 진행도) }
  const livestock = {};
  for (const id of Object.keys(ANIMALS)) livestock[id] = { count: 0, prog: 0 };

  // 건물: 종류별 레벨 (0 = 미건설)
  const buildings = {};
  for (const id of Object.keys(BUILDINGS)) buildings[id] = 0;

  // 연구: 분야별 레벨
  const research = {};
  for (const id of Object.keys(RESEARCH_FIELDS)) research[id] = 0;

  // 인근 마을: 발견/교역 여부
  const villages = VILLAGE_TEMPLATES.map((v) => ({
    id: v.id,
    discovered: false,
    tradeOpen: false,
  }));

  // 재화 인벤토리 (모든 재화 0에서 시작) + 사료 약간
  const inventory = {};
  for (const id of Object.keys(GOODS)) inventory[id] = 0;
  inventory.wheat = 4;
  const feed = 30;

  // 시장 가격: 기본가에서 시작
  const prices = {};
  for (const g of Object.values(GOODS)) prices[g.id] = g.basePrice;

  return {
    // 시간
    day: 1, // 누적 일수 (1부터)
    // 자산/주민
    money: START_MONEY,
    population: START_POP,
    happiness: 60,
    taxRate: DEFAULT_TAX,
    influence: 0,
    rankIndex: 0,
    // 생산 시스템
    farm,
    livestock,
    buildings,
    research,
    villages,
    inventory,
    feed,
    prices,
    // 도구로 모으는 자원
    wood: 10,
    stone: 4,
    // 고용한 일꾼 (개별 인물 배열)
    workers: [], // { id, name, job, xp, happiness, resting }
    nextWorkerId: 1,
    // 플레이어 성장 + 통계 + 퀘스트
    fame: 0,
    exp: 0,
    level: 1,
    stats: { harvested: 0, fished: 0, built: 0, chopped: 0, mined: 0, crafted: 0 },
    dailyBase: { harvested: 0, fished: 0, built: 0, chopped: 0, mined: 0, crafted: 0 },
    claimed: [], // 보상 받은 퀘스트 id
    equipped: [], // 장착한 장비 아이템 id
    // 마을 레벨 + 주민 만족도 세부지표
    villageLevel: 1,
    satisfaction: { food: 60, safety: 50, culture: 40, education: 30, hygiene: 45 },
    // 월드: 벌목/채굴된 자연물(respawn 추적) + 배치한 장식물
    removed: [], // [{ key, type, day }]
    placed: [], // [{ type, x, y }]
    // 하루 행동 제한
    fishUsed: 0,
    // 날씨 (advanceDay 첫 호출 전 기본값)
    weather: 'sunny',
    // 진행 로그
    log: [{ day: 1, text: '🌅 새로운 마을 생활을 시작합니다!', kind: 'info' }],
  };
}
