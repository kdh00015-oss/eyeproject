// 일꾼(고용) 시스템 정의
//  직종별 고용비/일급/식량 + 자동 노동 내용. 연구로 효율이 추가로 상승한다.

export const JOBS = {
  farmer: {
    id: 'farmer', name: '농부', icon: '🧑‍🌾', hire: 120, wage: 6, food: 0.4,
    desc: '매일 다 자란 밭을 자동 수확·재파종 (농업 연구 ↑)', site: 'farm', color: '#6ab04c',
  },
  fisher: {
    id: 'fisher', name: '어부', icon: '🎣', hire: 140, wage: 7, food: 0.4,
    desc: '매일 자동으로 물고기를 잡음 (어업 연구 ↑)', site: 'dock', color: '#4aa3d6',
  },
  lumberjack: {
    id: 'lumberjack', name: '나무꾼', icon: '🪓', hire: 100, wage: 5, food: 0.4,
    desc: '매일 목재를 모음 (행정 연구 ↑)', site: 'forest', color: '#8a6a44',
  },
  miner: {
    id: 'miner', name: '광부', icon: '⛏️', hire: 130, wage: 6, food: 0.4,
    desc: '매일 돌을 캠 (행정 연구 ↑)', site: 'rock', color: '#9aa0a6',
  },
  rancher: {
    id: 'rancher', name: '목축업자', icon: '🐄', hire: 150, wage: 7, food: 0.4,
    desc: '축산물 생산량을 크게 늘림 (축산 연구 ↑)', site: 'barn', color: '#e0b86a',
  },
};

export const JOB_LIST = Object.values(JOBS);

// 직종별 1인당 기본 산출(연구 효율 적용 전)
export const OUTPUT = {
  lumberjackWood: 3, // 나무꾼: 목재/일
  minerStone: 2, // 광부: 돌/일
  fisherCatch: 2, // 어부: 마리/일
  farmerPlots: 3, // 농부: 처리 밭 수/일
  rancherBonus: 0.15, // 목축업자 1인당 축산물 +15%
};

// --- 숙련도(레벨) ---
export const MAX_WORKER_LEVEL = 5;
export const XP_THRESHOLDS = [0, 100, 250, 450, 700]; // index = level-1
export function levelFromXp(xp) {
  let lvl = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) if (xp >= XP_THRESHOLDS[i]) lvl = i + 1;
  return lvl;
}
export function levelMult(level) {
  return 1 + (level - 1) * 0.15; // 레벨당 +15% 효율
}

// --- 행복도/휴식 ---
export const WORK_FATIGUE = 6; // 하루 노동 시 행복도 감소
export const REST_RECOVER = 25; // 휴식 시 회복
export const REST_THRESHOLD = 25; // 이 이하로 떨어지면 휴식 진입
export const REST_BACK = 80; // 이 이상 회복되면 복귀
export const UNPAID_PENALTY = 30; // 급여 체불 시 행복도 하락

// 일꾼 이름 풀
export const WORKER_NAMES = [
  '민준', '서연', '도윤', '지우', '하준', '서윤', '예준', '지호', '수아', '지안',
  '은우', '유준', '채원', '시우', '윤서', '지민', '하은', '준우', '수빈', '다은',
  '건우', '서아', '주원', '지율', '연우', '소율', '재이', '나윤', '현우', '아인',
];
export function randomName(used) {
  const pool = WORKER_NAMES.filter((n) => !used.includes(n));
  const list = pool.length ? pool : WORKER_NAMES;
  return list[Math.floor(Math.random() * list.length)];
}

// 맵에서 일꾼 NPC가 일하는 위치(중심 타일)
export const JOB_SITE = {
  farm: { x: 6, y: 21 },
  dock: { x: 10, y: 9 },
  forest: { x: 4, y: 12 },
  rock: { x: 8, y: 11 },
  barn: { x: 14, y: 23 },
};
