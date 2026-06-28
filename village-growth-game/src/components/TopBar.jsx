// 상단 바: 날짜/계절/날씨/직위/마을 등급 + 재생 속도 + 저장/새게임

import { WEATHERS, RANKS } from '../game/constants';
import { SPEEDS } from '../hooks/useGame';

export default function TopBar({
  state,
  derived,
  time,
  speedId,
  setSpeedId,
  onSave,
  onNewGame,
}) {
  const weather = WEATHERS[state.weather];
  const rank = RANKS[state.rankIndex];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">🏡 마을 성장 시뮬</span>
      </div>

      <div className="topbar-stats">
        <span className="chip">📅 {time.year}년차 {time.season.icon}{time.season.name} {time.dayOfSeason}일</span>
        <span className="chip">{weather.icon} {weather.name}</span>
        <span className="chip">{rank.icon} {rank.name}</span>
        <span className="chip">🏘️ {derived.grade.name}</span>
      </div>

      <div className="topbar-controls">
        <div className="speed-group">
          {SPEEDS.map((s) => (
            <button
              key={s.id}
              className={'speed-btn' + (speedId === s.id ? ' active' : '')}
              onClick={() => setSpeedId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn" onClick={onSave}>💾 저장</button>
        <button className="btn btn-danger" onClick={onNewGame}>🌱 새 게임</button>
      </div>
    </header>
  );
}
