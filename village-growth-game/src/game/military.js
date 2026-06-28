// 군사: 장수(장군) + 군대(병종) + 정복 전쟁
//  마을의 '일꾼(경제)'과 구분되는 '장수(군사)' 개념. 장수가 군대를 이끈다.

import { VILLAGE_TEMPLATES } from './constants';

export const WAR_UNLOCK_RANK = 3; // 촌장 이상에서 전쟁 해금

// 병종 (cost: 모집 비용, upkeep: 일일 유지비, power: 전투력)
export const TROOPS = {
  infantry: { id: 'infantry', name: '보병', icon: '🛡️', cost: 50, upkeep: 1, power: 10 },
  archer: { id: 'archer', name: '궁수', icon: '🏹', cost: 70, upkeep: 1.5, power: 13 },
  cavalry: { id: 'cavalry', name: '기병', icon: '🐎', cost: 120, upkeep: 3, power: 20 },
};
export const TROOP_LIST = Object.values(TROOPS);

export const GENERAL_COST = 300;
export const GENERAL_UPKEEP = 10;
export const GENERAL_NAMES = [
  '관우', '장비', '조운', '여포', '하후돈', '황충', '마초', '전위', '태사자', '감녕',
  '을지문덕', '강감찬', '이순신', '김유신', '연개소문', '척준경', '계백', '온달',
];
export function rollGeneral(id, usedNames) {
  const pool = GENERAL_NAMES.filter((n) => !usedNames.includes(n));
  const name = (pool.length ? pool : GENERAL_NAMES)[Math.floor(Math.random() * (pool.length ? pool.length : GENERAL_NAMES.length))];
  const r = () => 35 + Math.floor(Math.random() * 50); // 35~84
  return { id, name, might: r(), command: r(), intellect: r() };
}

// 군대 총 전투력 (장수 보너스 포함)
export function armyPower(state) {
  let base = 0;
  for (const t of TROOP_LIST) base += (state.army[t.id] || 0) * t.power;
  // 최고 장수의 무력+통솔로 보너스
  let bonus = 1;
  for (const g of state.generals) bonus = Math.max(bonus, 1 + (g.might + g.command) / 200);
  return Math.round(base * bonus);
}
export function troopCount(state) {
  return TROOP_LIST.reduce((s, t) => s + (state.army[t.id] || 0), 0);
}
export function armyUpkeep(state) {
  let u = state.generals.length * GENERAL_UPKEEP;
  for (const t of TROOP_LIST) u += (state.army[t.id] || 0) * t.upkeep;
  return Math.round(u);
}

// 마을 방어력 (거리에 비례)
export const VILLAGE_DEFENSE = {};
VILLAGE_TEMPLATES.forEach((v, i) => { VILLAGE_DEFENSE[v.id] = 60 + i * 120; });

export function villageDefense(id) { return VILLAGE_DEFENSE[id] || 100; }
