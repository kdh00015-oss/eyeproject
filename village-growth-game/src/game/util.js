// 공용 유틸 함수 모음

// min~max 사이로 값 제한
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// 0 이상 정수 난수 (max 미포함)
export function randInt(max) {
  return Math.floor(Math.random() * max);
}

// 가중치 기반 무작위 선택
// items: [{ weight, ... }] 형태 배열 → 하나를 가중치 비례로 반환
export function weightedPick(items) {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

// [min, max) 실수 난수
export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// 숫자를 보기 좋게 (소수 1자리 또는 정수)
export function fmt(n) {
  if (Number.isInteger(n)) return n.toLocaleString();
  return (Math.round(n * 10) / 10).toLocaleString();
}

// 고유 id 생성 (저장에 영향 없는 휘발성 카운터)
let _uid = 0;
export function uid() {
  _uid += 1;
  return _uid;
}
