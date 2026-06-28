// 좌측: 자원 현황 (골드, 인구, 행복도, 영향력, 사료, 저장 한도, 보유 재화)

import { GOODS } from '../game/goods';
import { fmt } from '../game/util';

export default function ResourcePanel({ state, derived }) {
  // 보유 중인(1개 이상) 재화만 표시
  const owned = Object.values(GOODS)
    .filter((g) => (state.inventory[g.id] || 0) > 0)
    .map((g) => ({ ...g, qty: state.inventory[g.id] }));

  return (
    <aside className="panel resource-panel">
      <h2 className="panel-title">📊 자원 현황</h2>

      <div className="stat-grid">
        <Stat icon="💰" label="골드" value={fmt(Math.floor(state.money))} />
        <Stat
          icon="👥"
          label="인구"
          value={`${Math.floor(state.population)}/${derived.maxPop}`}
        />
        <Stat icon="😊" label="행복도" value={`${Math.round(state.happiness)}%`} />
        <Stat icon="⭐" label="영향력" value={fmt(Math.floor(state.influence))} />
        <Stat icon="🌿" label="사료" value={fmt(state.feed)} />
        <Stat
          icon="📦"
          label="저장"
          value={`${Math.floor(derived.stored)}/${derived.storageCap}`}
        />
      </div>

      <div className="happiness-bar">
        <div
          className="happiness-fill"
          style={{
            width: `${state.happiness}%`,
            background:
              state.happiness > 60 ? '#6dd36d' : state.happiness > 35 ? '#f4c542' : '#e0604a',
          }}
        />
      </div>

      <h3 className="sub-title">🎒 보유 재화</h3>
      {owned.length === 0 ? (
        <p className="empty">아직 보유한 생산물이 없습니다.</p>
      ) : (
        <ul className="goods-list">
          {owned.map((g) => (
            <li key={g.id}>
              <span>{g.icon} {g.name}</span>
              <span className="qty">{fmt(g.qty)}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
