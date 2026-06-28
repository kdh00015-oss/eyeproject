// 주점: 떠돌이 영웅(장수)을 등용하는 곳
import { GENERAL_COST } from '../../game/military';

export default function TavernPanel({ state, actions }) {
  const generals = state.generals || [];
  return (
    <div className="tavern">
      <p className="hint">🍺 주점에는 떠돌이 영웅이 들릅니다. 골드로 영웅(장수)을 등용하세요. 영웅은 전쟁(촌장 이상)에서 군대를 이끕니다.</p>
      <button className="wide-btn" disabled={state.money < GENERAL_COST} onClick={() => actions.recruitGeneral()}>
        🎖️ 영웅 등용 ({GENERAL_COST}G)
      </button>
      <h3 className="sub-title">우리 영웅 ({generals.length})</h3>
      {generals.length === 0 ? (
        <p className="empty">아직 등용한 영웅이 없습니다.</p>
      ) : (
        <div className="general-list">
          {generals.map((g) => (
            <div key={g.id} className="general-card">
              <span className="general-name">🎖️ {g.name}</span>
              <span className="general-stats">무 {g.might} · 통 {g.command} · 지 {g.intellect}</span>
              <button className="btn-sm sell" onClick={() => actions.dismissGeneral(g.id)}>해임</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
