// 계절별 색감 팔레트 + 낮/밤 조명 계산

export const SEASON_PALETTE = {
  spring: { grass: '#6ab04c', grass2: '#5fa043', tree: '#3e8e41', leaf: '#7bc96f', sand: '#e7d8a8', soil: '#8a5a3c', water: '#4aa3d6', flower: '#ff6fae' },
  summer: { grass: '#57a83a', grass2: '#4e9a34', tree: '#2f7d34', leaf: '#5fb85a', sand: '#ecdfae', soil: '#92603f', water: '#3f9fe0', flower: '#ffd24a' },
  fall: { grass: '#9a8f3e', grass2: '#8f7f37', tree: '#b5651d', leaf: '#e08a2e', sand: '#e3cf9a', soil: '#7d4f33', water: '#4f93b8', flower: '#e06a3a' },
  winter: { grass: '#cfe0e6', grass2: '#c2d6dd', tree: '#6b7d6e', leaf: '#dfeaec', sand: '#dde6e8', soil: '#6f5a4a', water: '#7fb4d6', flower: '#bcd4e6' },
};

export function paletteFor(seasonId) {
  return SEASON_PALETTE[seasonId] || SEASON_PALETTE.spring;
}

// 하루를 0~1 (0=자정, 0.5=정오)로 받아 야간 오버레이 색을 반환
//  새벽/황혼은 따뜻한 주황, 깊은 밤은 짙은 남색
export function nightOverlay(tOfDay) {
  // 일출 ~0.27 (06:30), 일몰 ~0.8 (19:00)
  let darkness; // 0(낮)~0.62(밤)
  if (tOfDay < 0.22 || tOfDay > 0.86) darkness = 0.6;
  else if (tOfDay < 0.3) darkness = 0.6 * (1 - (tOfDay - 0.22) / 0.08);
  else if (tOfDay > 0.78) darkness = 0.6 * ((tOfDay - 0.78) / 0.08);
  else darkness = 0;
  darkness = Math.max(0, Math.min(0.6, darkness));

  // 색조: 새벽/황혼은 주황기, 밤은 남색
  let r = 12, g = 18, b = 48;
  if ((tOfDay > 0.24 && tOfDay < 0.33) || (tOfDay > 0.74 && tOfDay < 0.83)) {
    r = 60; g = 30; b = 30; // 황혼/여명 따뜻한 색
  }
  return `rgba(${r},${g},${b},${darkness})`;
}

export function isNight(tOfDay) {
  return tOfDay < 0.25 || tOfDay > 0.82;
}

// HH:MM 문자열
export function clockString(tOfDay) {
  const mins = Math.floor(tOfDay * 24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
