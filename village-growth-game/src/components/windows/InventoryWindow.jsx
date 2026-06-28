// RPG 인벤토리: 장비 슬롯 + 능력치 + 가방(희귀도/분류/정렬/툴팁) + 장착/사용/강화/수리

import { useState } from 'react';
import { ITEM_DB, itemDef, RARITY, RARITY_ORDER, CATEGORY_ORDER } from '../../game/items';
import { itemCount } from '../../game/crafting';
import { GEAR_SLOTS, playerStats, enhanceCost, repairCost } from '../../game/combat';
import { fmt } from '../../game/util';

const TABS = [
  { id: 'all', name: '전체' }, { id: 'material', name: '재료' },
  { id: 'consumable', name: '소비' }, { id: 'equipment', name: '장비' },
];

export default function InventoryWindow({ state, actions }) {
  const owned = Object.values(ITEM_DB)
    .map((it) => ({ ...it, count: itemCount(state, it.id) }))
    .filter((it) => it.count > 0);
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(null); // {type:'bag',id} | {type:'gear',slot}

  const stats = playerStats(state);
  const sorted = [...owned].sort((a, b) =>
    CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
    RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || a.name.localeCompare(b.name)
  );
  const list = sorted.filter((it) => tab === 'all' || it.category === tab);

  let detail = null;
  if (sel?.type === 'bag') {
    const d = itemDef(sel.id);
    detail = (
      <div className="inv-detail">
        <div className="inv-detail-head">
          <span className="inv-detail-icon">{d.icon}</span>
          <div>
            <div className="inv-detail-name" style={{ color: RARITY[d.rarity].color }}>{d.name}</div>
            <div className="inv-detail-meta">{RARITY[d.rarity].name} · 보유 {fmt(itemCount(state, d.id))}
              {d.slot ? ` · ${gearStatText(d)}` : ''}</div>
          </div>
        </div>
        <p className="inv-detail-desc">{d.desc}</p>
        {d.category === 'consumable' && <button className="wide-btn" onClick={() => actions.useItem(d.id)}>사용하기</button>}
        {d.category === 'equipment' && d.slot && <button className="wide-btn" onClick={() => actions.equip(d.id)}>장착하기</button>}
      </div>
    );
  } else if (sel?.type === 'gear') {
    const inst = state.gear[sel.slot];
    if (inst) {
      const d = itemDef(inst.id);
      const ec = enhanceCost(inst.enh);
      const rc = repairCost(d, inst.dur);
      detail = (
        <div className="inv-detail">
          <div className="inv-detail-head">
            <span className="inv-detail-icon">{d.icon}</span>
            <div>
              <div className="inv-detail-name" style={{ color: RARITY[d.rarity].color }}>{d.name}{inst.enh > 0 ? ` +${inst.enh}` : ''}</div>
              <div className="inv-detail-meta">{gearStatText(d, inst.enh)}{d.maxDur ? ` · 내구 ${inst.dur}/${d.maxDur}` : ''}</div>
            </div>
          </div>
          <p className="inv-detail-desc">{d.desc}</p>
          <div className="gear-btns">
            <button className="btn-sm" onClick={() => actions.unequip(sel.slot)}>해제</button>
            <button className="btn-sm buy" onClick={() => actions.enhance(sel.slot)}>강화 (💰{ec.gold} 🔮{ec.crystal})</button>
            {d.maxDur > 0 && inst.dur < d.maxDur && <button className="btn-sm" onClick={() => actions.repair(sel.slot)}>수리 (💰{rc})</button>}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="inv">
      {/* 능력치 + 장비 슬롯 */}
      <div className="gear-panel">
        <div className="gear-stats">
          <span>⚔️ 공격 {stats.atk}</span><span>🛡️ 방어 {stats.def}</span><span>❤️ 체력 {stats.hpMax}</span>
        </div>
        <div className="gear-slots">
          {GEAR_SLOTS.map((s) => {
            const inst = state.gear[s.id];
            const d = inst ? itemDef(inst.id) : null;
            return (
              <button key={s.id} className={'gear-slot' + (sel?.type === 'gear' && sel.slot === s.id ? ' sel' : '')}
                style={d ? { borderColor: RARITY[d.rarity].color } : undefined}
                onClick={() => setSel(inst ? { type: 'gear', slot: s.id } : null)} title={s.name}>
                {d ? <span className="gear-icon">{d.icon}</span> : <span className="gear-empty">{s.icon}</span>}
                {inst && inst.enh > 0 && <span className="gear-enh">+{inst.enh}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 가방 */}
      <div className="inv-tabs">
        {TABS.map((t) => <button key={t.id} className={'inv-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.name}</button>)}
      </div>
      <div className="inv-grid">
        {list.map((it) => (
          <button key={it.id} className={'inv-slot' + (sel?.type === 'bag' && sel.id === it.id ? ' sel' : '')}
            style={{ borderColor: RARITY[it.rarity].color }} onClick={() => setSel({ type: 'bag', id: it.id })} title={it.name}>
            <span className="inv-icon">{it.icon}</span>
            <span className="inv-count">{fmt(it.count)}</span>
          </button>
        ))}
        {Array.from({ length: Math.max(0, 18 - list.length) }).map((_, i) => <div key={'e' + i} className="inv-slot empty" />)}
      </div>

      {detail || <p className="hint">아이템/장비 슬롯을 클릭하면 정보가 표시됩니다.</p>}
    </div>
  );
}

function gearStatText(d, enh = 0) {
  const m = 1 + enh * 0.2;
  const parts = [];
  if (d.atk) parts.push(`공 +${Math.round(d.atk * m)}`);
  if (d.def) parts.push(`방 +${Math.round(d.def * m)}`);
  if (d.hp) parts.push(`체 +${d.hp}`);
  return parts.join(' ');
}
