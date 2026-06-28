// 건설 메뉴: 건물 선택 + 철거 모드

import { BUILDINGS, RESOURCES } from '../game/config';
import { canAfford } from '../game/engine';

function CostTag({ cost }) {
  return (
    <span className="cost">
      {Object.entries(cost).map(([res, amt]) => (
        <span key={res} className="cost-item">
          {RESOURCES[res].icon}
          {amt}
        </span>
      ))}
    </span>
  );
}

export default function BuildMenu({ selected, onSelect, resources }) {
  return (
    <div className="build-menu">
      <h2 className="panel-title">건설 메뉴</h2>
      <p className="hint">
        건물을 고른 뒤 격자의 빈 칸을 클릭하세요.
      </p>

      {Object.values(BUILDINGS).map((b) => {
        const affordable = canAfford(resources, b.cost);
        const active = selected === b.id;
        return (
          <button
            key={b.id}
            className={
              'build-option' +
              (active ? ' active' : '') +
              (affordable ? '' : ' disabled')
            }
            onClick={() => onSelect(active ? null : b.id)}
          >
            <span className="build-icon">{b.icon}</span>
            <span className="build-info">
              <span className="build-name">{b.name}</span>
              <span className="build-desc">{b.desc}</span>
            </span>
            <CostTag cost={b.cost} />
          </button>
        );
      })}

      <button
        className={'build-option demolish' + (selected === 'demolish' ? ' active' : '')}
        onClick={() => onSelect(selected === 'demolish' ? null : 'demolish')}
      >
        <span className="build-icon">⛏️</span>
        <span className="build-info">
          <span className="build-name">철거</span>
          <span className="build-desc">건물 제거 (비용 50% 환급)</span>
        </span>
      </button>
    </div>
  );
}
