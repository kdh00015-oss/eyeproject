// 군사/전쟁: 장수 등용 + 군대 모집 + 인근 마을 정복

import { useState } from 'react';
import { RANKS, VILLAGE_TEMPLATES } from '../../game/constants';
import {
  WAR_UNLOCK_RANK, TROOP_LIST, GENERAL_COST,
  armyPower, troopCount, armyUpkeep, villageDefense,
} from '../../game/military';
import { fmt } from '../../game/util';

const TABS = [
  { id: 'general', name: '장수' },
  { id: 'army', name: '군대' },
  { id: 'war', name: '정복' },
];

export default function MilitaryWindow({ state, actions }) {
  const [tab, setTab] = useState('general');
  const locked = state.rankIndex < WAR_UNLOCK_RANK;

  if (locked) {
    return (
      <div className="mil">
        <p className="warn-box">⚔️ 전쟁은 <b>{RANKS[WAR_UNLOCK_RANK].name}</b> 직위부터 열립니다. 마을을 키우고 직위를 올리세요. (현재: {RANKS[state.rankIndex].name})</p>
      </div>
    );
  }

  const power = armyPower(state);
  const owned = state.villages.filter((v) => v.owned).length;

  return (
    <div className="mil">
      <div className="mil-summary">
        <span className="hud-chip">⚔️ 군사력 {fmt(power)}</span>
        <span className="hud-chip">👥 병력 {troopCount(state)}</span>
        <span className="hud-chip">🎖️ 장수 {state.generals.length}</span>
        <span className="hud-chip">🏰 영토 {owned}</span>
        <span className="hud-chip">💸 유지비 {armyUpkeep(state)}/일</span>
      </div>
      <div className="inv-tabs">
        {TABS.map((t) => <button key={t.id} className={'inv-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.name}</button>)}
      </div>

      {tab === 'general' && (
        <div>
          <button className="wide-btn" onClick={actions.recruitGeneral}>🎖️ 장수 등용 (💰{GENERAL_COST})</button>
          <div className="gen-list">
            {state.generals.length === 0 && <p className="empty">아직 등용한 장수가 없습니다.</p>}
            {state.generals.map((g) => (
              <div key={g.id} className="gen-card">
                <div className="gen-head"><span className="gen-name">🎖️ {g.name}</span>
                  <button className="btn-sm sell" onClick={() => actions.dismissGeneral(g.id)}>해임</button></div>
                <div className="gen-stats">무력 {g.might} · 통솔 {g.command} · 지력 {g.intellect}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'army' && (
        <div className="troop-list">
          {TROOP_LIST.map((t) => (
            <div key={t.id} className="troop-card">
              <div className="troop-head"><span className="troop-name">{t.icon} {t.name}</span>
                <span className="muted">보유 {state.army[t.id] || 0}</span></div>
              <small className="muted">전투력 {t.power} · 모집 {t.cost}G · 유지 {t.upkeep}/일</small>
              <div className="troop-btns">
                <button className="btn-sm buy" onClick={() => actions.recruitTroop(t.id, 1)}>+1</button>
                <button className="btn-sm buy" onClick={() => actions.recruitTroop(t.id, 5)}>+5</button>
                <button className="btn-sm sell" disabled={(state.army[t.id] || 0) <= 0} onClick={() => actions.disbandTroop(t.id, 1)}>-1</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'war' && (
        <div className="war-list">
          <p className="hint">발견한 인근 마을을 정복해 영토로 삼으세요. 군사력이 마을 방어력보다 높아야 승리 확률이 큽니다. (장수·군대 필요)</p>
          {state.villages.filter((v) => v.discovered).length === 0 && <p className="empty">먼저 교역소에서 마을을 탐험해 발견하세요.</p>}
          {state.villages.filter((v) => v.discovered).map((v) => {
            const tpl = VILLAGE_TEMPLATES.find((t) => t.id === v.id);
            const def = villageDefense(v.id);
            return (
              <div key={v.id} className="war-card">
                <div className="war-head"><span className="war-name">🏘️ {tpl.name}</span>
                  <span className={'muted ' + (power >= def ? 'up' : 'down')}>방어력 {def}</span></div>
                {v.owned ? (
                  <div className="trade-open">🏰 정복 완료 — 영토</div>
                ) : (
                  <button className="wide-btn" disabled={state.generals.length === 0 || troopCount(state) === 0}
                    onClick={() => { if (confirm(`${tpl.name}을(를) 공격할까요? (내 군사력 ${power} vs 방어 ${def})`)) actions.attackVillage(v.id); }}>
                    ⚔️ 출정 (군사력 {fmt(power)})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
