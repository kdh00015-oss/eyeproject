// 고용소 탭: 일꾼 고용 + 개별 일꾼(이름/숙련도/행복도/휴식/작업량) 관리

import { JOB_LIST, JOBS, OUTPUT, levelFromXp, levelMult, MAX_WORKER_LEVEL } from '../../game/workers';

// 일꾼 1명의 하루 예상 생산량 (휴식 중이면 0)
function dailyOutput(w, state) {
  if (w.resting) return null;
  const mult = levelMult(levelFromXp(w.xp));
  const laborEff = 1 + (state.research.admin || 0) * 0.05;
  switch (w.job) {
    case 'lumberjack': return { icon: '🪵', label: '목재', amount: Math.round(OUTPUT.lumberjackWood * mult * laborEff), unit: '/일' };
    case 'miner': return { icon: '🪨', label: '돌', amount: Math.round(OUTPUT.minerStone * mult * laborEff), unit: '/일' };
    case 'fisher': return { icon: '🐟', label: '물고기', amount: Math.round((OUTPUT.fisherCatch + Math.floor((state.research.fishing || 0) / 2)) * mult), unit: '마리/일' };
    case 'farmer': return { icon: '🌾', label: '자동수확', amount: Math.floor(OUTPUT.farmerPlots * mult), unit: '칸/일' };
    case 'rancher': return { icon: '🐄', label: '축산물', amount: Math.round(OUTPUT.rancherBonus * mult * 100), unit: '%↑' };
    default: return null;
  }
}

export default function WorkersPanel({ state, derived, actions }) {
  const workers = state.workers;
  const used = Math.floor(state.population) + workers.length;
  const wageTotal = workers.reduce((s, w) => s + JOBS[w.job].wage, 0);
  const housingFull = used >= derived.maxPop;

  // 오늘의 생산 요약 (휴식 제외 합산)
  const summary = {};
  for (const w of workers) {
    const o = dailyOutput(w, state);
    if (!o) continue;
    const key = o.label + o.unit + o.icon;
    summary[key] = summary[key] || { icon: o.icon, label: o.label, unit: o.unit, amount: 0 };
    summary[key].amount += o.amount;
  }
  const summaryList = Object.values(summary);
  const restingCount = workers.filter((w) => w.resting).length;

  return (
    <div className="workers">
      <div className="worker-summary">
        <span className="hud-chip">🏠 주거 {used}/{derived.maxPop}</span>
        <span className="hud-chip">💸 일급 합계 {wageTotal}G/일</span>
        <span className="hud-chip">👷 일꾼 {workers.length}명{restingCount ? ` (😴${restingCount})` : ''}</span>
      </div>

      {/* 오늘의 생산 요약 — 일꾼들이 하루에 만들어내는 양 */}
      {summaryList.length > 0 && (
        <div className="prod-summary">
          <span className="prod-title">📦 하루 생산</span>
          {summaryList.map((s) => (
            <span key={s.label + s.unit} className="prod-chip">{s.icon} {s.label} +{s.amount}{s.unit}</span>
          ))}
        </div>
      )}
      <p className="hint">
        일꾼은 매일 자동으로 일하며 <b>숙련도</b>가 오릅니다(효율 ↑). 일하면 <b>행복도</b>가 줄고,
        지치면 스스로 <b>휴식</b>합니다. 급여를 못 주면 떠납니다.
        {housingFull && ' ⚠️ 주거가 가득 찼습니다 — 집(🏠)을 더 지으세요.'}
      </p>

      {/* 고용 버튼 */}
      <h3 className="sub-title">고용하기</h3>
      <div className="hire-row">
        {JOB_LIST.map((j) => {
          const canHire = state.money >= j.hire && !housingFull;
          return (
            <button key={j.id} className="hire-btn" disabled={!canHire} onClick={() => actions.hire(j.id)}
              title={`${j.desc} · 일급 ${j.wage}G`}>
              <span className="hire-icon">{j.icon}</span>
              <span className="hire-name">{j.name}</span>
              <span className="hire-cost">{j.hire}G</span>
            </button>
          );
        })}
      </div>

      {/* 고용된 일꾼 목록 */}
      <h3 className="sub-title">우리 마을 일꾼 ({workers.length})</h3>
      {workers.length === 0 ? (
        <p className="empty">아직 고용한 일꾼이 없습니다.</p>
      ) : (
        <div className="worker-list">
          {workers.map((w) => {
            const job = JOBS[w.job];
            const lvl = levelFromXp(w.xp);
            return (
              <div key={w.id} className="worker-card">
                <div className="worker-head">
                  <span className="worker-name">{job.icon} {w.name}</span>
                  <span className="worker-count">{job.name}</span>
                </div>
                <div className="worker-stars">
                  {Array.from({ length: MAX_WORKER_LEVEL }).map((_, i) => (
                    <span key={i} className={i < lvl ? 'star on' : 'star'}>★</span>
                  ))}
                  <span className="worker-status">{w.resting ? '😴 휴식 중' : '🛠️ 일하는 중'}</span>
                </div>
                <div className="worker-output">
                  {(() => { const o = dailyOutput(w, state); return o
                    ? <>📈 {o.icon} {o.label} <b>+{o.amount}{o.unit}</b></>
                    : <span className="rest-note">휴식 중 — 오늘은 생산 없음</span>; })()}
                </div>
                <div className="happy-bar">
                  <div className="happy-fill" style={{
                    width: `${w.happiness}%`,
                    background: w.happiness > 60 ? '#6dd36d' : w.happiness > 30 ? '#f4c542' : '#e0604a',
                  }} />
                </div>
                <button className="btn-sm sell" onClick={() => actions.fireWorker(w.id)}>해고</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
