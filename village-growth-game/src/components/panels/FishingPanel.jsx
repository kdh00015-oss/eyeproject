// 낚시 탭: 낚시터별 낚시 + 잡히는 물고기 안내

import { SPOT_LIST } from '../../game/fishing';
import { BASE_FISH_PER_DAY } from '../../game/constants';

export default function FishingPanel({ state, actions }) {
  const maxFish = BASE_FISH_PER_DAY + state.research.fishing;
  const left = Math.max(0, maxFish - state.fishUsed);

  return (
    <div className="fishing">
      <p className="hint">
        오늘 남은 낚시 횟수: <b>{left}/{maxFish}</b> · 날짜가 바뀌면 초기화됩니다.
        (어업 연구로 횟수와 희귀 확률이 늘어납니다)
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
                disabled={locked || left <= 0}
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
