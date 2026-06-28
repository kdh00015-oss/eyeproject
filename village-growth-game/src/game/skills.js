// 생활 스킬: 분야별 Lv1~100, 경험치로 성장 (기존 시스템에 가산되는 보너스)

export const SKILLS = [
  { id: 'farming', name: '농업', icon: '🌾' },
  { id: 'fishing', name: '어업', icon: '🎣' },
  { id: 'livestock', name: '축산', icon: '🐄' },
  { id: 'foraging', name: '벌목', icon: '🪓' },
  { id: 'mining', name: '채광', icon: '⛏️' },
  { id: 'crafting', name: '제작', icon: '⚒️' },
  { id: 'combat', name: '전투', icon: '⚔️' },
  { id: 'trade', name: '상업', icon: '💹' },
];
export const MAX_SKILL = 100;

export function skillLevel(xp) {
  return Math.min(MAX_SKILL, 1 + Math.floor((xp || 0) / 120));
}
// 레벨당 +0.5% (최대 ~+50%)
export function skillBonus(xp) {
  return 1 + (skillLevel(xp) - 1) * 0.005;
}
export function nextLevelXp(xp) {
  return skillLevel(xp) * 120;
}
export function emptySkills() {
  const s = {};
  for (const sk of SKILLS) s[sk.id] = 0;
  return s;
}
