// 도감 + 업적 창
import { useState } from 'react';
import { DEX_CATEGORIES, dexHas, dexProgress, ACHIEVEMENTS } from '../../game/collection';

export default function CollectionWindow({ state }) {
  const [tab, setTab] = useState('dex');
  const prog = dexProgress(state);
  const achievedSet = new Set(state.achieved || []);

  return (
    <div className="dex">
      <div className="market-tabs">
        <button className={'mk-tab' + (tab === 'dex' ? ' on' : '')} onClick={() => setTab('dex')}>📖 도감 {prog.all.found}/{prog.all.total}</button>
        <button className={'mk-tab' + (tab === 'ach' ? ' on' : '')} onClick={() => setTab('ach')}>🏆 업적 {achievedSet.size}/{ACHIEVEMENTS.length}</button>
      </div>

      {tab === 'dex' && (
        <div className="dex-body">
          {DEX_CATEGORIES.map((cat) => (
            <div key={cat.key} className="dex-cat">
              <h3 className="sub-title">{cat.icon} {cat.name} <span className="dex-count">{prog[cat.key].found}/{prog[cat.key].total}</span></h3>
              <div className="dex-grid">
                {cat.items.map((g) => {
                  const found = dexHas(state, g.id);
                  return (
                    <div key={g.id} className={'dex-cell' + (found ? '' : ' unknown')} title={found ? g.name : '미발견'}>
                      <span className="dex-icon">{found ? g.icon : '❓'}</span>
                      <span className="dex-name">{found ? g.name : '???'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="hint">작물 수확 · 낚시 · 축산물 생산 · 구매로 도감을 채울 수 있어요. 완성하면 업적 보상도!</p>
        </div>
      )}

      {tab === 'ach' && (
        <div className="ach-body">
          {ACHIEVEMENTS.map((a) => {
            const done = achievedSet.has(a.id);
            return (
              <div key={a.id} className={'ach-row' + (done ? ' done' : '')}>
                <span className="ach-icon">{done ? a.icon : '🔒'}</span>
                <span className="ach-text">
                  <b>{a.name}</b>
                  <small>{a.desc}</small>
                </span>
                <span className="ach-reward">{a.reward.gold ? `${a.reward.gold}G ` : ''}{a.reward.fame ? `${a.reward.fame}⭐` : ''}</span>
              </div>
            );
          })}
          <p className="hint">업적은 조건을 만족하면 하루가 지날 때 자동 달성되고 보상이 지급됩니다.</p>
        </div>
      )}
    </div>
  );
}
