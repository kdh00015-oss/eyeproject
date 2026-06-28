// 기술 연구 정의
//  연구소(lab) 건설이 필요하며, 분야별로 레벨을 올린다.
//  레벨당 효과: 농업/어업/축산/상업/행정 각각의 생산·수익 향상

export const RESEARCH_FIELDS = {
  agriculture: {
    id: 'agriculture',
    name: '농업 연구',
    icon: '🌱',
    desc: '작물 수확량 +10% / 레벨',
  },
  fishing: {
    id: 'fishing',
    name: '어업 연구',
    icon: '🎣',
    desc: '어획 가치 +8%, 희귀 확률 증가 / 레벨',
  },
  livestock: {
    id: 'livestock',
    name: '축산 연구',
    icon: '🐮',
    desc: '축산물 가치 +10% / 레벨',
  },
  commerce: {
    id: 'commerce',
    name: '상업 연구',
    icon: '💹',
    desc: '판매가·교역수익 +8% / 레벨',
  },
  admin: {
    id: 'admin',
    name: '행정 연구',
    icon: '📜',
    desc: '세수 +10%, 행복도 +3 / 레벨',
  },
};

export const RESEARCH_LIST = Object.values(RESEARCH_FIELDS);
export const MAX_RESEARCH_LEVEL = 5;

// 다음 레벨로 올리는 데 드는 연구 비용(골드)
export function researchCost(level) {
  return Math.round(120 * (level + 1) * Math.pow(1.4, level));
}
