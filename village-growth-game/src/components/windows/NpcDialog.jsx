// NPC 대화: 여러 대사를 넘겨가며 읽고, 상인이면 거래(시장)도 가능
import { useState } from 'react';
import MarketPanel from '../panels/MarketPanel';

export default function NpcDialog({ npc, state, derived, time, actions }) {
  const lines = npc.lines && npc.lines.length ? npc.lines : ['…안녕하세요.'];
  const [idx, setIdx] = useState(0);
  const [trading, setTrading] = useState(false);
  const merchant = npc.role === 'merchant';

  return (
    <div className="npc-dialog">
      {!trading && (
        <>
          <p className="npc-line">“{lines[idx % lines.length]}”</p>
          <div className="npc-actions">
            {lines.length > 1 && (
              <button className="mini-btn wide" onClick={() => setIdx((i) => i + 1)}>다음 이야기 ↻</button>
            )}
            {merchant && (
              <button className="mini-btn wide on" onClick={() => setTrading(true)}>🛒 거래하기</button>
            )}
          </div>
        </>
      )}
      {trading && (
        <>
          <p className="npc-line">“무엇을 사고 파시겠어요?”</p>
          <MarketPanel state={state} derived={derived} time={time} actions={actions} />
          <button className="mini-btn wide" onClick={() => setTrading(false)}>← 대화로 돌아가기</button>
        </>
      )}
    </div>
  );
}
