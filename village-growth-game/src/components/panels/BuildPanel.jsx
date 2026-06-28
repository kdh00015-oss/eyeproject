// 건설 탭: 건물 건설/업그레이드

import { BUILDING_LIST, buildingCost } from '../../game/buildings';

export default function BuildPanel({ state, actions }) {
  return (
    <div className="build">
      <p className="hint">
        건물을 건설하고 업그레이드해 마을 기능을 확장하세요. 레벨이 오를수록 효과가 커집니다.
      </p>
      <div className="building-list">
        {BUILDING_LIST.map((b) => {
          const level = state.buildings[b.id];
          const maxed = level >= b.maxLevel;
          const cost = maxed ? 0 : buildingCost(b.id, level);
          const afford = state.money >= cost;
          return (
            <div key={b.id} className="building-card">
              <div className="building-head">
                <span className="building-name">{b.icon} {b.name}</span>
                <span className={'lv' + (level > 0 ? '' : ' off')}>Lv.{level}/{b.maxLevel}</span>
              </div>
              <small className="building-desc">{b.desc}</small>
              <button
                className="wide-btn"
                disabled={maxed || !afford}
                onClick={() => actions.build(b.id)}
              >
                {maxed
                  ? '최대 레벨'
                  : `${level === 0 ? '건설' : '업그레이드'} (${cost}G)`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
