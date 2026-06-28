// 낚시 탭: 낚시터별 낚시 + 잡히는 물고기 안내

import { SPOT_LIST } from '../../game/fishing';

export default function FishingPanel({ state, actions }) {
  return (
    <div className="fishing">
      <p className="hint">
        낚시터를 골라 자유롭게 낚시하세요. (어업 연구로 희귀 물고기 확률이 올라갑니다)
      </p>

      <div className="spot-list">
        {SPOT_LIST.map((spot) => {
          const locked =
            spot.requires &&
            state.buildings[spot.requires.building] < spot.requires.level;
          return (
            <div key={spot.id} className={'spot-card' + (locked ? ' locked' : '')}>
              <div className="spot-head">
                <span className="spot-name">{spot.icon} {spot.name}</span>
                {locked && <span className="lock">🔒 항구 필요</span>}
              </div>
              <ul className="fish-info">
                {spot.fish.map((f) => (
                  <li key={f.id} className={f.rare ? 'rare' : ''}>
                    {f.icon} {f.name} <span className="price">{f.basePrice}G</span>
                    {f.rare && <span className="rare-tag">희귀</span>}
                  </li>
                ))}
              </ul>
              <button
                className="wide-btn"
                disabled={locked}
                onClick={() => actions.fish(spot.id)}
              >
                🎣 {spot.name}에서 낚시
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
