// 생활 스킬: 분야별 Lv1~100, 경험치로 성장 (기존 시스템에 가산되는 보너스)

export const SKILLS = [
  { id: 'farming', name: '농업', icon: '🌾', benefit: '작물 수확량 증가' },
  { id: 'fishing', name: '어업', icon: '🎣', benefit: '한 번에 여러 마리 낚을 확률' },
  { id: 'livestock', name: '축산', icon: '🐄', benefit: '축산물 생산량 증가' },
  { id: 'foraging', name: '벌목', icon: '🪓', benefit: '벌목 시 목재량 증가' },
  { id: 'mining', name: '채광', icon: '⛏️', benefit: '채광 시 돌·광물량 증가' },
  { id: 'crafting', name: '제작', icon: '⚒️', benefit: '제작 시 추가 산출 확률' },
  { id: 'combat', name: '전투', icon: '⚔️', benefit: '전투 보상(골드·경험치) 증가' },
  { id: 'trade', name: '상업', icon: '💹', benefit: '판매가 증가' },
];
export const MAX_SKILL = 100;

export function skillLevel(xp) {
  return Math.min(MAX_SKILL, 1 + Math.floor((xp || 0) / 120));
}
// 레벨당 +1.5% (최대 ~+150%) — 체감되는 보너스
export function skillBonus(xp) {
  return 1 + (skillLevel(xp) - 1) * 0.015;
}
export function nextLevelXp(xp) {
  return skillLevel(xp) * 120;
}
export function emptySkills() {
  const s = {};
  for (const sk of SKILLS) s[sk.id] = 0;
  return s;
}
