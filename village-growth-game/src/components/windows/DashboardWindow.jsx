// 대시보드: 좌우로 넘겨보는 여러 페이지(챕터) — 통계 / 목표 / 여정
import { useState } from 'react';
import { RANKS } from '../../game/constants';
import { GOALS, goalProgress } from '../../game/goals';

const CHAPTERS = [
  { id: 'stats', name: '통계', icon: '📊' },
  { id: 'goals', name: '목표', icon: '🎯' },
  { id: 'journey', name: '여정', icon: '🧭' },
];

// 간단한 라인 그래프 (SVG)
function Spark({ data, color, w = 280, h = 56, fmt = (v) => v }) {
  if (!data || data.length < 2) return <div className="spark-empty">데이터가 쌓이는 중… (하루가 지나면 기록됩니다)</div>;
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const sx = (x) => maxX === minX ? 0 : ((x - minX) / (maxX - minX)) * (w - 8) + 4;
  const sy = (y) => maxY === minY ? h / 2 : h - 6 - ((y - minY) / (maxY - minY)) * (h - 12);
  const pts = data.map((d) => `${sx(d.x).toFixed(1)},${sy(d.y).toFixed(1)}`).join(' ');
  const last = ys[ys.length - 1];
  return (
    <div className="spark">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={sx(xs[xs.length - 1])} cy={sy(last)} r="2.6" fill={color} />
      </svg>
      <div className="spark-meta"><span>min {fmt(minY)}</span><span>now {fmt(last)}</span><span>max {fmt(maxY)}</span></div>
    </div>
  );
}

export default function DashboardWindow({ state, derived }) {
  const [page, setPage] = useState(0);
  const ch = CHAPTERS[page];
  const go = (d) => setPage((p) => (p + d + CHAPTERS.length) % CHAPTERS.length);
  const hist = state.history || [];

  return (
    <div className="dash">
      {/* 챕터 탭 */}
      <div className="dash-tabs">
        {CHAPTERS.map((c, i) => (
          <button key={c.id} className={'dash-tab' + (i === page ? ' on' : '')} onClick={() => setPage(i)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* 페이지 본문 */}
      <div className="dash-body">
        {ch.id === 'stats' && <StatsPage state={state} hist={hist} />}
        {ch.id === 'goals' && <GoalsPage state={state} />}
        {ch.id === 'journey' && <JourneyPage state={state} derived={derived} />}
      </div>

      {/* 페이저 (좌우로 넘기기) */}
      <div className="dash-pager">
        <button className="mini-btn" onClick={() => go(-1)}>‹ 이전</button>
        <div className="dash-dots">
          {CHAPTERS.map((c, i) => <span key={c.id} className={'dot' + (i === page ? ' on' : '')} />)}
        </div>
        <button className="mini-btn" onClick={() => go(1)}>다음 ›</button>
      </div>
    </div>
  );
}

function StatsPage({ state, hist }) {
  const money = hist.map((d) => ({ x: d.d, y: d.m }));
  const pop = hist.map((d) => ({ x: d.d, y: d.p }));
  const fame = hist.map((d) => ({ x: d.d, y: d.f }));
  return (
    <div className="dash-stats">
      <div className="stat-graph"><h4>💰 골드 추이</h4><Spark data={money} color="#e7c54a" /></div>
      <div className="stat-graph"><h4>👥 인구 추이</h4><Spark data={pop} color="#6cc36c" /></div>
      <div className="stat-graph"><h4>⭐ 명성 추이</h4><Spark data={fame} color="#7da7ff" /></div>
      <div className="stat-now">
        <span className="hud-chip">💰 {Math.floor(state.money)}</span>
        <span className="hud-chip">👥 {Math.floor(state.population)}</span>
        <span className="hud-chip">⭐ {Math.floor(state.fame)}</span>
        <span className="hud-chip">📅 {state.day}일차</span>
      </div>
    </div>
  );
}

function GoalsPage({ state }) {
  const prog = goalProgress(state);
  // 미완료 중 앞쪽 항목을 '현재 목표'로 강조
  let highlighted = 0;
  return (
    <div className="dash-goals">
      <p className="hint">진행 목표 {prog.done}/{prog.total} — 무엇을 할지 막막하면 위에서부터 차근차근!</p>
      <div className="goal-list">
        {GOALS.map((g) => {
          const done = g.done(state);
          const isNext = !done && highlighted < 2;
          if (isNext) highlighted += 1;
          return (
            <div key={g.id} className={'goal-row' + (done ? ' done' : isNext ? ' next' : '')}>
              <span className="goal-check">{done ? '✅' : isNext ? '👉' : '⬜'}</span>
              <span className="goal-icon">{g.icon}</span>
              <span className="goal-text"><b>{g.name}</b><small>{g.desc}</small></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyPage({ state, derived }) {
  const metrics = {
    population: Math.floor(state.population),
    money: Math.floor(state.money),
    influence: Math.floor(state.influence),
    buildingLevels: derived.buildingLevels,
    researchTotal: derived.researchTotal,
    trades: derived.trades,
  };
  const LABEL = { population: '인구', money: '골드', influence: '영향력', buildingLevels: '건물합', researchTotal: '연구합', trades: '교역로' };
  const cur = state.rankIndex;
  return (
    <div className="dash-journey">
      <p className="hint">마을 → 도시 → 왕국 → 제국. 직위를 올리며 성장하세요.</p>
      <div className="journey-list">
        {RANKS.map((r, i) => {
          const reached = i <= cur;
          const isNext = i === cur + 1;
          const reqs = Object.entries(r.req || {});
          return (
            <div key={r.id} className={'journey-row' + (reached ? ' reached' : isNext ? ' next' : '')}>
              <span className="journey-icon">{reached ? r.icon : isNext ? r.icon : '🔒'}</span>
              <span className="journey-name">{r.name}{i === cur ? ' (현재)' : ''}</span>
              {isNext && reqs.length > 0 && (
                <span className="journey-req">
                  {reqs.map(([k, v]) => (
                    <span key={k} className={'req' + (metrics[k] >= v ? ' ok' : '')}>
                      {LABEL[k] || k} {Math.min(metrics[k], v)}/{v}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
