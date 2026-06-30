// 삼국지식 영토 전역 화면: 성 지도 + 모병/장수배치/공격 + 다음 턴
import { useState } from 'react';
import {
  TERRITORIES, territoryById, factionColor, factionName, garrisonPower,
  attackOrigins, WAR_COLS, WAR_ROWS, WAR_TROOP_COST,
} from '../../game/warmap';
import { WAR_UNLOCK_RANK } from '../../game/military';
import { RANKS } from '../../game/constants';
import { fmt } from '../../game/util';

export default function CampaignMap({ state, actions }) {
  const [sel, setSel] = useState('home');
  if (state.rankIndex < WAR_UNLOCK_RANK) {
    return <p className="warn-box">🗺️ 영토 전역은 <b>{RANKS[WAR_UNLOCK_RANK].name}</b> 직위부터 열립니다. (현재: {RANKS[state.rankIndex].name})</p>;
  }
  const war = state.war;
  const terr = war.terr;
  const st = terr[sel];
  const info = territoryById(sel);
  const owned = Object.keys(terr).filter((id) => terr[id].owner === 'player').length;
  const totalIncome = Object.keys(terr).reduce((s, id) => s + (terr[id].owner === 'player' ? territoryById(id).income : 0), 0);

  // 보유 장수 + 각 장수가 맡은 영토
  const genLoc = {};
  for (const id of Object.keys(terr)) { const g = terr[id].gen; if (g && g.id != null) genLoc[g.id] = id; }

  const origins = st.owner !== 'player' ? attackOrigins(war, sel, 'player') : [];
  const bestOrigin = origins.length ? origins.reduce((a, b) => (terr[a].troops >= terr[b].troops ? a : b)) : null;

  const WAR_ICONS = ['⚔️', '📜', '👑', '🪖', '🎖️', '🤺', '🧠'];
  const warLog = (state.log || []).filter((l) => WAR_ICONS.some((ic) => l.text.startsWith(ic))).slice(0, 6);

  return (
    <div className="camp">
      <div className="camp-top">
        <span className="hud-chip">📜 {war.turn}턴</span>
        <span className="hud-chip">🏰 영토 {owned}/{TERRITORIES.length}</span>
        <span className="hud-chip">💰 수입 {totalIncome}/턴</span>
        <button className="btn-sm buy" onClick={actions.warEndTurn}>다음 턴 ▶</button>
      </div>
      {war.unified && <p className="warn-box" style={{ borderColor: '#f0a93b' }}>👑 천하통일 달성!</p>}

      <div className="camp-map" style={{ gridTemplateColumns: `repeat(${WAR_COLS}, 1fr)`, gridTemplateRows: `repeat(${WAR_ROWS}, 1fr)` }}>
        {TERRITORIES.map((t) => {
          const s = terr[t.id];
          const fc = factionColor(s.owner);
          return (
            <button key={t.id} className={'camp-cell' + (sel === t.id ? ' on' : '')}
              style={{ gridColumn: t.col + 1, gridRow: t.row + 1, borderColor: fc, boxShadow: sel === t.id ? `0 0 0 2px ${fc}` : 'none' }}
              onClick={() => setSel(t.id)}>
              <span className="cc-dot" style={{ background: fc }} />
              <span className="cc-name">{t.name}</span>
              <span className="cc-troops">{s.gen ? '🎖️' : ''}{fmt(s.troops)}</span>
            </button>
          );
        })}
      </div>

      <div className="camp-detail">
        <div className="cd-head">
          <span className="cd-name" style={{ color: factionColor(st.owner) }}>{info.name}</span>
          <span className="muted">{factionName(st.owner)} · 병력 {fmt(st.troops)} · 전투력 {fmt(garrisonPower(st))}</span>
        </div>
        <div className="cd-line">
          {st.gen ? `🎖️ ${st.gen.name} (무${st.gen.might}/통${st.gen.command}/지${st.gen.intellect})` : '🎖️ 수비장 없음'}
          {info.income > 0 && <span className="muted">　수입 {info.income}G · 영향력 {info.inf}/턴</span>}
        </div>
        <div className="cd-line muted">인접: {info.nb.map((n) => territoryById(n).name).join(', ')}</div>

        {st.owner === 'player' ? (
          <div className="cd-actions">
            <div className="cd-row">
              <button className="btn-sm buy" onClick={() => actions.warRecruit(sel, 50)}>모병 +50 (💰{50 * WAR_TROOP_COST})</button>
              <button className="btn-sm buy" onClick={() => actions.warRecruit(sel, 100)}>모병 +100 (💰{100 * WAR_TROOP_COST})</button>
            </div>
            <div className="cd-row">
              <span className="muted">수비장 배치:</span>
              {state.generals.length === 0 && <span className="muted">— 주점에서 장수를 등용하세요</span>}
              {state.generals.map((g) => (
                <button key={g.id} className={'btn-sm' + (st.gen && st.gen.id === g.id ? ' on' : '')}
                  onClick={() => actions.warDeployGeneral(sel, g.id)}>
                  {g.name}{genLoc[g.id] && genLoc[g.id] !== sel ? `(${territoryById(genLoc[g.id]).name})` : ''}
                </button>
              ))}
            </div>
            <div className="cd-row">
              <span className="muted">출정:</span>
              {info.nb.filter((n) => terr[n].owner !== 'player').length === 0 && <span className="muted">— 인접한 적 영토 없음</span>}
              {info.nb.filter((n) => terr[n].owner !== 'player').map((n) => (
                <button key={n} className="btn-sm sell" disabled={st.troops <= 0}
                  onClick={() => { if (confirm(`${info.name}(병력 ${st.troops})에서 ${territoryById(n).name}(병력 ${terr[n].troops})을 공격할까요?`)) actions.warAttack(n, sel); }}>
                  ⚔️ {territoryById(n).name} 공격
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cd-actions">
            {bestOrigin ? (
              <button className="wide-btn" onClick={() => { if (confirm(`${territoryById(bestOrigin).name}(병력 ${terr[bestOrigin].troops})에서 ${info.name}(병력 ${st.troops})을 공격할까요?`)) actions.warAttack(sel, bestOrigin); }}>
                ⚔️ {territoryById(bestOrigin).name}에서 출정 (전투력 {fmt(garrisonPower(terr[bestOrigin]))} vs {fmt(garrisonPower(st))})
              </button>
            ) : (
              <p className="muted">인접한 아군 영토가 없어 공격할 수 없습니다. 먼저 인접 성을 확보하세요.</p>
            )}
          </div>
        )}
      </div>

      {warLog.length > 0 && (
        <div className="camp-log">
          {warLog.map((l, i) => <div key={i} className={'cl-' + l.kind}>{l.text}</div>)}
        </div>
      )}
    </div>
  );
}
