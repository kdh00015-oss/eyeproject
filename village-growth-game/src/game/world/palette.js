// 계절 색감 + 시간대별 색온도(낮/노을/밤) 부드러운 보간

export const SEASON_PALETTE = {
  spring: { grass: '#6ab04c', grass2: '#5fa043', grass3: '#74bd56', tree: '#3e8e41', leaf: '#7bc96f', sand: '#e7d8a8', soil: '#8a5a3c', water: '#4aa3d6', flower: '#ff6fae', dirt: '#bd9a6a' },
  summer: { grass: '#57a83a', grass2: '#4e9a34', grass3: '#62b343', tree: '#2f7d34', leaf: '#5fb85a', sand: '#ecdfae', soil: '#92603f', water: '#3f9fe0', flower: '#ffd24a', dirt: '#c2a06f' },
  fall: { grass: '#9a8f3e', grass2: '#8f7f37', grass3: '#a89a48', tree: '#b5651d', leaf: '#e08a2e', sand: '#e3cf9a', soil: '#7d4f33', water: '#4f93b8', flower: '#e06a3a', dirt: '#b08f5e' },
  winter: { grass: '#cfe0e6', grass2: '#c2d6dd', grass3: '#d8e7ec', tree: '#6b7d6e', leaf: '#dfeaec', sand: '#dde6e8', soil: '#6f5a4a', water: '#7fb4d6', flower: '#bcd4e6', dirt: '#a9b3b6' },
};

export function paletteFor(seasonId) {
  return SEASON_PALETTE[seasonId] || SEASON_PALETTE.spring;
}

// 시간대별 환경광 키프레임 (t, r, g, b, a)
const KEYS = [
  { t: 0.0, r: 12, g: 20, b: 52, a: 0.55 }, // 깊은 밤
  { t: 0.2, r: 20, g: 24, b: 60, a: 0.46 }, // 새벽 직전
  { t: 0.27, r: 255, g: 150, b: 80, a: 0.24 }, // 여명(따뜻)
  { t: 0.34, r: 255, g: 220, b: 170, a: 0.06 },
  { t: 0.5, r: 255, g: 255, b: 255, a: 0.0 }, // 정오
  { t: 0.7, r: 255, g: 240, b: 200, a: 0.05 },
  { t: 0.77, r: 255, g: 120, b: 55, a: 0.26 }, // 노을(따뜻)
  { t: 0.85, r: 40, g: 30, b: 65, a: 0.45 }, // 황혼→밤
  { t: 1.0, r: 12, g: 20, b: 52, a: 0.55 },
];

function lerp(a, b, f) { return a + (b - a) * f; }

// 환경광 오버레이 색 (rgba 문자열)
export function ambientOverlay(t) {
  let i = 0;
  while (i < KEYS.length - 1 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const span = b.t - a.t || 1;
  const f = Math.max(0, Math.min(1, (t - a.t) / span));
  const r = Math.round(lerp(a.r, b.r, f));
  const g = Math.round(lerp(a.g, b.g, f));
  const bl = Math.round(lerp(a.b, b.b, f));
  const al = lerp(a.a, b.a, f);
  return { color: `rgba(${r},${g},${bl},${al})`, alpha: al };
}

export function isNight(t) {
  return t < 0.24 || t > 0.82;
}

export function clockString(t) {
  const mins = Math.floor(t * 24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
