// 퀘스트 창: 메인/서브/일일 + 진행도 + 보상 수령

import { useState } from 'react';
import { QUESTS, questProgress } from '../../game/quests';
import { itemDef } from '../../game/items';

const TABS = [
  { id: 'main', name: '메인' },
  { id: 'sub', name: '서브' },
  { id: 'daily', name: '일일' },
];

function rewardText(reward) {
  const parts = [];
  if (reward.gold) parts.push(`💰${reward.gold}`);
  if (reward.fame) parts.push(`⭐${reward.fame}`);
  if (reward.exp) parts.push(`✨${reward.exp}`);
  for (const it of reward.items || []) parts.push(`${itemDef(it.id).icon}${it.qty}`);
  return parts.join(' ');
}

export default function QuestWindow({ state, derived, actions }) {
  const [tab, setTab] = useState('main');
  const list = QUESTS.filter((q) => q.type === tab);
  // 메인 퀘스트는 순차 진행: 첫 미수령 퀘스트가 '현재', 그 이후는 잠금
  const activeIndex = tab === 'main' ? list.findIndex((q) => !state.claimed.includes(q.id)) : -1;

  return (
    <div className="quest">
      <div className="inv-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'inv-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.name}</button>
        ))}
      </div>
      {tab === 'main' && <p className="hint">메인 퀘스트는 순서대로 진행됩니다. 완료하고 보상을 받으면 다음 단계가 열립니다.</p>}
      <div className="quest-list">
        {list.map((q, i) => {
          const p = questProgress(state, derived, q);
          const pct = Math.round((p.cur / p.target) * 100);
          // 메인: 아직 안 열린 다음 단계는 잠금
          const locked = tab === 'main' && activeIndex >= 0 && i > activeIndex;
          if (locked) {
            return (
              <div key={q.id} className="quest-card locked">
                <div className="quest-top">
                  <span className="quest-name">🔒 ???</span>
                  <span className="quest-reward muted">이전 메인 완료 시 해금</span>
                </div>
              </div>
            );
          }
          const isActive = tab === 'main' && i === activeIndex;
          return (
            <div key={q.id} className={'quest-card' + (p.claimed ? ' done' : '') + (isActive ? ' active' : '')}>
              <div className="quest-top">
                <span className="quest-name">{isActive ? '👉 ' : ''}{q.name}</span>
                <span className="quest-reward">{rewardText(q.reward)}</span>
              </div>
              <p className="quest-desc">{q.desc}</p>
              <div className="quest-bar"><div className="quest-fill" style={{ width: `${pct}%` }} /></div>
              <div className="quest-foot">
                <span className="muted">{p.cur}/{p.target}</span>
                {p.claimed ? (
                  <span className="quest-claimed">✓ 완료</span>
                ) : (
                  <button className="btn-sm buy" disabled={!p.done} onClick={() => actions.claimQuest(q.id)}>
                    {p.done ? '보상 수령' : '진행 중'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {tab === 'main' && activeIndex < 0 && <p className="empty">🎉 모든 메인 퀘스트를 완료했습니다!</p>}
      </div>
    </div>
  );
}
