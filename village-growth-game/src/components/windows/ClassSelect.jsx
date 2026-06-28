// 시작 직업 선택 오버레이 — 새 게임 시작 시 1회 표시 (선택은 출발점일 뿐, 플레이로 다른 분야도 익힘)

import { CLASS_LIST } from '../../game/classes';

export default function ClassSelect({ onPick, onSkip }) {
  return (
    <div className="class-overlay">
      <div className="class-box">
        <h2 className="class-title">🌟 시작 직업을 선택하세요</h2>
        <p className="class-sub">
          직업은 출발점입니다. 어떤 직업이든 플레이하며 모든 분야의 숙련도를 키울 수 있어요.
        </p>
        <div className="class-grid">
          {CLASS_LIST.map((c) => (
            <button key={c.id} className="class-card" onClick={() => onPick(c.id)}>
              <div className="class-icon">{c.icon}</div>
              <div className="class-name">{c.name}</div>
              <ul className="class-perks">
                {c.perks.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        <button className="class-skip" onClick={onSkip}>
          직업 없이 자유롭게 시작 →
        </button>
      </div>
    </div>
  );
}
