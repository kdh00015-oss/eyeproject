// 연구 탭: 분야별 기술 연구 (연구소 필요)

import { RESEARCH_LIST, researchCost, MAX_RESEARCH_LEVEL } from '../../game/research';

export default function ResearchPanel({ state, derived, actions }) {
  return (
    <div className="research">
      {!derived.researchEnabled && (
        <p className="warn-box">⚠️ 연구소(🔬)를 건설해야 연구할 수 있습니다.</p>
      )}
      <p className="hint">
        연구 레벨이 오를수록 해당 분야의 생산량과 수익이 증가합니다.
        {derived.researchDiscount > 0 &&
          ` (연구소 효과로 연구비 ${Math.round(derived.researchDiscount * 100)}% 할인)`}
      </p>

      <div className="research-list">
        {RESEARCH_LIST.map((f) => {
          const level = state.research[f.id];
          const maxed = level >= MAX_RESEARCH_LEVEL;
          const cost = maxed
            ? 0
            : Math.round(researchCost(level) * (1 - derived.researchDiscount));
          const afford = state.money >= cost;
          return (
            <div key={f.id} className="research-card">
              <div className="research-head">
                <span className="research-name">{f.icon} {f.name}</span>
                <span className="lv">Lv.{level}/{MAX_RESEARCH_LEVEL}</span>
              </div>
              <small className="research-desc">{f.desc}</small>
              <div className="research-pips">
                {Array.from({ length: MAX_RESEARCH_LEVEL }).map((_, i) => (
                  <span key={i} className={'pip' + (i < level ? ' on' : '')} />
                ))}
              </div>
              <button
                className="wide-btn"
                disabled={maxed || !afford || !derived.researchEnabled}
                onClick={() => actions.research(f.id)}
              >
                {maxed ? '연구 완료' : `연구 (${cost}G)`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
