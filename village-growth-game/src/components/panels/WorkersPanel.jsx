// 고용소 탭: 일꾼 고용/해고 (자동 노동 + 급여/식량/주거 관리)

import { JOB_LIST } from '../../game/workers';

export default function WorkersPanel({ state, derived, actions }) {
  const totalWorkers = Object.values(state.workers).reduce((s, v) => s + v, 0);
  const used = Math.floor(state.population) + totalWorkers;
  const wageTotal = JOB_LIST.reduce((s, j) => s + state.workers[j.id] * j.wage, 0);
  const housingFull = used >= derived.maxPop;

  return (
    <div className="workers">
      <div className="worker-summary">
        <span className="hud-chip">🏠 주거 {used}/{derived.maxPop}</span>
        <span className="hud-chip">💸 일급 합계 {wageTotal}G/일</span>
        <span className="hud-chip">👷 일꾼 {totalWorkers}명</span>
      </div>
      <p className="hint">
        일꾼은 매일 자동으로 일합니다(급여·식량 소비, 주거 필요). 연구 레벨이 오르면 효율이 증가합니다.
        {housingFull && ' ⚠️ 주거가 가득 찼습니다 — 집(🏠)을 더 지으세요.'}
      </p>

      <div className="worker-list">
        {JOB_LIST.map((j) => {
          const count = state.workers[j.id];
          const canHire = state.money >= j.hire && !housingFull;
          return (
            <div key={j.id} className="worker-card">
              <div className="worker-head">
                <span className="worker-name">{j.icon} {j.name}</span>
                <span className="worker-count">{count}명</span>
              </div>
              <small className="worker-desc">{j.desc}</small>
              <small className="worker-cost">고용비 {j.hire}G · 일급 {j.wage}G · 식량 {j.food}/일</small>
              <div className="worker-actions">
                <button className="btn-sm buy" disabled={!canHire} onClick={() => actions.hire(j.id)}>
                  고용 ({j.hire}G)
                </button>
                <button className="btn-sm sell" disabled={count <= 0} onClick={() => actions.fire(j.id)}>
                  해고
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
