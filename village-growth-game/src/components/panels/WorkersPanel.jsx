// 고용소 탭: 일꾼 고용 + 개별 일꾼(이름/숙련도/행복도/휴식/작업량) 관리

import { JOB_LIST, JOBS, OUTPUT, levelFromXp, levelMult, MAX_WORKER_LEVEL, XP_THRESHOLDS, trainCost } from '../../game/workers';

// 현재 레벨 안에서의 경험치 진행도 + 다음 레벨까지 남은 경험치
function xpInfo(xp) {
  const lvl = levelFromXp(xp);
  const cur = XP_THRESHOLDS[lvl - 1] || 0;
  const next = lvl < MAX_WORKER_LEVEL ? XP_THRESHOLDS[lvl] : null;
  const pct = next ? Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) : 100;
  const remain = next ? next - xp : 0;
  return { lvl, pct, remain, next };
}

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
        일꾼은 매일 자동으로 일합니다. <b>골드로 훈련</b>하면 즉시 레벨업하고, 레벨이 높을수록 <b>효율이 크게</b> 오릅니다(레벨당 +30%).
        일하면 <b>행복도</b>가 줄고 지치면 <b>휴식</b>하며, 급여를 못 주면 떠납니다.
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

      {/* 고용된 일꾼 — 직종별로 구분 */}
      <h3 className="sub-title">우리 마을 일꾼 ({workers.length})</h3>
      {workers.length === 0 ? (
        <p className="empty">아직 고용한 일꾼이 없습니다.</p>
      ) : (
        JOB_LIST.map((job) => {
          const group = workers.filter((w) => w.job === job.id);
          if (group.length === 0) return null;
          // 이 직종의 하루 합계 생산
          let total = 0, unit = '', icon = '';
          for (const w of group) { const o = dailyOutput(w, state); if (o) { total += o.amount; unit = o.unit; icon = o.icon; } }
          return (
            <div key={job.id} className="job-group">
              <div className="job-group-head">
                <span className="job-group-name">{job.icon} {job.name} <b>×{group.length}</b></span>
                {icon && <span className="job-group-out">📦 {icon} +{total}{unit}</span>}
              </div>
              <div className="worker-list">
                {group.map((w) => {
                  const xi = xpInfo(w.xp);
                  const eff = Math.round((levelMult(xi.lvl) - 1) * 100);
                  return (
                    <div key={w.id} className="worker-card">
                      <div className="worker-head">
                        <span className="worker-name">{job.icon} {w.name}</span>
                        <span className="worker-count">Lv.{xi.lvl}{eff > 0 ? ` (효율 +${eff}%)` : ''}</span>
                      </div>
                      <div className="worker-stars">
                        {Array.from({ length: MAX_WORKER_LEVEL }).map((_, i) => (
                          <span key={i} className={i < xi.lvl ? 'star on' : 'star'}>★</span>
                        ))}
                        <span className="worker-status">{w.resting ? '😴 휴식 중' : '🛠️ 일하는 중'}</span>
                      </div>
                      <div className="xp-row">
                        <div className="xp-bar"><div className="xp-fill" style={{ width: `${xi.pct}%` }} /></div>
                        <span className="xp-text">{xi.next ? `Lv.${xi.lvl + 1}까지 ${xi.remain} XP` : '최고 레벨 ★'}</span>
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
                      <div className="worker-btns">
                        {xi.lvl < MAX_WORKER_LEVEL ? (
                          <button className="btn-sm buy" disabled={state.money < trainCost(xi.lvl)}
                            onClick={() => actions.trainWorker(w.id)}
                            title={`골드로 즉시 레벨업 → Lv.${xi.lvl + 1} (효율 +${Math.round((levelMult(xi.lvl + 1) - 1) * 100)}%)`}>
                            📈 훈련 Lv.{xi.lvl + 1} ({trainCost(xi.lvl)}G)
                          </button>
                        ) : (
                          <span className="rest-note">최고 레벨 달성 ★</span>
                        )}
                        <button className="btn-sm sell" onClick={() => actions.fireWorker(w.id)}>해고</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
