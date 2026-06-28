// 세이브 슬롯: 3개 슬롯 저장/불러오기/새 게임

import { SLOTS, slotMeta } from '../../game/storage';
import { fmt } from '../../game/util';

export default function SaveSlots({ current, slotTick, onSave, onLoad, onNew }) {
  return (
    <div className="slots">
      <p className="hint">3개의 슬롯에 따로 저장할 수 있습니다. 현재 슬롯에는 자동 저장됩니다.</p>
      {SLOTS.map((i) => {
        const meta = slotMeta(i); // slotTick 변경 시 리렌더로 재조회
        void slotTick;
        return (
          <div key={i} className={'slot-card' + (i === current ? ' active' : '')}>
            <div className="slot-info">
              <span className="slot-title">슬롯 {i + 1}{i === current ? ' (현재)' : ''}</span>
              {meta ? (
                <span className="slot-meta">D{meta.day} · Lv.{meta.level} · 💰{fmt(meta.money)} · 👥{meta.pop}</span>
              ) : (
                <span className="slot-meta muted">비어 있음</span>
              )}
            </div>
            <div className="slot-actions">
              <button className="btn-sm" onClick={() => onSave(i)}>저장</button>
              <button className="btn-sm" disabled={!meta} onClick={() => onLoad(i)}>불러오기</button>
              <button className="btn-sm sell" onClick={() => { if (confirm(`슬롯 ${i + 1}을 새 게임으로 시작할까요?`)) onNew(i); }}>새 게임</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
