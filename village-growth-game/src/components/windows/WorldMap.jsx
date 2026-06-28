// 전체(월드) 지도 — 모든 지역을 한눈에 보고, 클릭 한 번으로 이동(빠른 이동)
//  · 현재 위치 강조 · 다른 지역은 '이동' 버튼으로 즉시 워프
//  (걸어서 출구로 넘어가는 기존 방식은 그대로 유지됨)

import { MAP_META, MAP_ORDER } from '../../game/world/worldgen';

export default function WorldMap({ current, onTravel, onClose }) {
  return (
    <div className="world-overlay" onClick={onClose}>
      <div className="world-box" onClick={(e) => e.stopPropagation()}>
        <div className="world-head">
          <h2 className="world-title">🌐 전체 지도</h2>
          <button className="world-close" onClick={onClose}>✕</button>
        </div>
        <p className="world-sub">지역을 눌러 바로 이동할 수 있어요. (걸어서 노란 출구로 넘어가도 됩니다)</p>

        <div className="world-regions">
          {MAP_ORDER.map((id, i) => {
            const m = MAP_META[id];
            const here = id === current;
            return (
              <div className="world-link" key={id}>
                {i > 0 && <div className="world-road">↔</div>}
                <button
                  className={'world-region' + (here ? ' here' : '')}
                  onClick={() => { if (!here) { onTravel(id); onClose(); } }}
                  disabled={here}
                >
                  <div className="world-icon">{m.icon}</div>
                  <div className="world-name">{m.name}</div>
                  <div className="world-desc">{m.desc}</div>
                  <div className={'world-badge' + (here ? ' on' : '')}>
                    {here ? '📍 현재 위치' : '➜ 이동'}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
