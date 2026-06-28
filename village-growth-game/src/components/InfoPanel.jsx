// 우측: 건물/주민/다른 마을 요약 정보 + 직위 진행

import { BUILDINGS } from '../game/buildings';
import { RANKS, VILLAGE_TEMPLATES } from '../game/constants';
import { fmt } from '../game/util';

export default function InfoPanel({ state, derived }) {
  const nextRank = RANKS[state.rankIndex + 1];

  const SAT = [
    { k: 'food', name: '🍗 배고픔' },
    { k: 'safety', name: '🛡️ 안전' },
    { k: 'culture', name: '🎭 문화' },
    { k: 'education', name: '📚 교육' },
    { k: 'hygiene', name: '🚿 위생' },
  ];

  return (
    <aside className="panel info-panel">
      <h2 className="panel-title">🏛️ 마을 정보</h2>

      {/* 마을 레벨 + 주민 만족도 */}
      <div className="info-block">
        <h3 className="sub-title">마을 레벨 {state.villageLevel}</h3>
        <ul className="sat-list">
          {SAT.map((s) => {
            const v = Math.round(state.satisfaction[s.k]);
            return (
              <li key={s.k} className="sat-row">
                <span className="sat-name">{s.name}</span>
                <span className="sat-bar"><span className="sat-fill" style={{ width: `${v}%`, background: v > 60 ? '#6dd36d' : v > 35 ? '#f4c542' : '#e0604a' }} /></span>
                <span className="sat-val">{v}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 직위 진행 */}
      <div className="info-block">
        <h3 className="sub-title">직위</h3>
        <p className="info-line">
          현재: {RANKS[state.rankIndex].icon} <b>{RANKS[state.rankIndex].name}</b>
        </p>
        {nextRank ? (
          <div className="rank-next">
            <span className="muted">다음: {nextRank.icon} {nextRank.name}</span>
            <ul className="req-list">
              {Object.entries(nextRank.req).map(([k, v]) => {
                const cur = reqValue(state, derived, k);
                const ok = cur >= v;
                return (
                  <li key={k} className={ok ? 'ok' : ''}>
                    {reqLabel(k)} {fmt(Math.floor(cur))}/{fmt(v)} {ok ? '✓' : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="muted">최고 직위에 도달했습니다! 👑</p>
        )}
      </div>

      {/* 건물 */}
      <div className="info-block">
        <h3 className="sub-title">건물</h3>
        <ul className="mini-list">
          {Object.values(BUILDINGS).map((b) => (
            <li key={b.id}>
              <span>{b.icon} {b.name}</span>
              <span className={state.buildings[b.id] > 0 ? 'lv' : 'lv off'}>
                Lv.{state.buildings[b.id]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 다른 마을 */}
      <div className="info-block">
        <h3 className="sub-title">교역 마을</h3>
        <ul className="mini-list">
          {state.villages.map((v) => {
            const tpl = VILLAGE_TEMPLATES.find((t) => t.id === v.id);
            return (
              <li key={v.id}>
                <span>
                  {v.discovered ? `🏘️ ${tpl.name}` : '❓ 미발견 마을'}
                </span>
                <span className={v.tradeOpen ? 'lv' : 'lv off'}>
                  {v.tradeOpen ? '교역중' : v.discovered ? '발견' : '-'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function reqValue(state, derived, key) {
  switch (key) {
    case 'population': return state.population;
    case 'money': return state.money;
    case 'influence': return state.influence;
    case 'buildingLevels': return derived.buildingLevels;
    case 'researchTotal': return derived.researchTotal;
    case 'trades': return derived.trades;
    default: return 0;
  }
}

function reqLabel(key) {
  return {
    population: '인구',
    money: '골드',
    influence: '영향력',
    buildingLevels: '건물레벨',
    researchTotal: '연구레벨',
    trades: '교역로',
  }[key] || key;
}
