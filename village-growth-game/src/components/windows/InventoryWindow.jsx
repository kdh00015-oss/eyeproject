// RPG 인벤토리 창: 희귀도/분류 탭 + 드래그 정렬 + 아이템 설명 + 사용/장착

import { useState, useEffect } from 'react';
import { ITEM_DB, itemDef, RARITY, RARITY_ORDER, CATEGORY_ORDER } from '../../game/items';
import { itemCount } from '../../game/crafting';
import { fmt } from '../../game/util';

const TABS = [
  { id: 'all', name: '전체' },
  { id: 'material', name: '재료' },
  { id: 'consumable', name: '소비' },
  { id: 'equipment', name: '장비' },
];

export default function InventoryWindow({ state, actions }) {
  const owned = Object.values(ITEM_DB)
    .map((it) => ({ ...it, count: itemCount(state, it.id) }))
    .filter((it) => it.count > 0);
  const ownedIds = owned.map((o) => o.id).join(',');

  const [order, setOrder] = useState(owned.map((o) => o.id));
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);

  // 보유 목록 변화에 맞춰 순서 동기화
  useEffect(() => {
    setOrder((prev) => {
      const ids = owned.map((o) => o.id);
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedIds]);

  const autoSort = () => {
    const sorted = [...owned].sort((a, b) =>
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
      RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] ||
      a.name.localeCompare(b.name)
    ).map((o) => o.id);
    setOrder(sorted);
  };

  const onDrop = (targetId) => {
    if (!drag || drag === targetId) return;
    setOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(drag), to = arr.indexOf(targetId);
      arr.splice(from, 1); arr.splice(to, 0, drag);
      return arr;
    });
    setDrag(null);
  };

  const list = order
    .map((id) => owned.find((o) => o.id === id))
    .filter(Boolean)
    .filter((it) => tab === 'all' || it.category === tab);

  const selItem = sel ? itemDef(sel) : null;
  const selCount = sel ? itemCount(state, sel) : 0;
  const equipped = selItem && state.equipped.includes(selItem.id);

  return (
    <div className="inv">
      <div className="inv-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'inv-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.name}</button>
        ))}
        <button className="inv-sort" onClick={autoSort}>↕ 정렬</button>
      </div>

      <div className="inv-grid">
        {list.map((it) => (
          <button
            key={it.id}
            className={'inv-slot' + (sel === it.id ? ' sel' : '')}
            style={{ borderColor: RARITY[it.rarity].color }}
            draggable
            onDragStart={() => setDrag(it.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(it.id)}
            onClick={() => setSel(it.id)}
            title={it.name}
          >
            <span className="inv-icon">{it.icon}</span>
            <span className="inv-count">{fmt(it.count)}</span>
            {state.equipped.includes(it.id) && <span className="inv-eq">E</span>}
          </button>
        ))}
        {Array.from({ length: Math.max(0, 24 - list.length) }).map((_, i) => (
          <div key={'e' + i} className="inv-slot empty" />
        ))}
      </div>

      {selItem ? (
        <div className="inv-detail">
          <div className="inv-detail-head">
            <span className="inv-detail-icon">{selItem.icon}</span>
            <div>
              <div className="inv-detail-name" style={{ color: RARITY[selItem.rarity].color }}>{selItem.name}</div>
              <div className="inv-detail-meta">{RARITY[selItem.rarity].name} · {{ material: '재료', consumable: '소비', equipment: '장비' }[selItem.category]} · 보유 {fmt(selCount)}</div>
            </div>
          </div>
          <p className="inv-detail-desc">{selItem.desc}</p>
          {selItem.category === 'consumable' && (
            <button className="wide-btn" onClick={() => actions.useItem(selItem.id)}>사용하기</button>
          )}
          {selItem.category === 'equipment' && (
            <button className="wide-btn" onClick={() => actions.equip(selItem.id)}>{equipped ? '장착 해제' : '장착하기'}</button>
          )}
        </div>
      ) : (
        <p className="hint">아이템을 클릭하면 설명이 표시됩니다. 드래그해서 정렬할 수 있습니다.</p>
      )}
    </div>
  );
}
