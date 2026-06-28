// 시장 탭: 판매/구매 (버튼을 길게 누르면 연속 구매/판매)

import { useState, useRef, useCallback } from 'react';
import { GOODS_LIST } from '../../game/goods';
import { sellPrice, buyPrice } from '../../game/engine';
import { fmt } from '../../game/util';

// 누르고 있는 동안 점점 빠르게 반복 실행
function useHold() {
  const t = useRef(null);
  const stop = useCallback(() => { if (t.current) { clearTimeout(t.current); t.current = null; } }, []);
  const start = useCallback((fn) => {
    stop();
    if (fn() === false) return; // 한 번 실행, false면 중단
    let delay = 320;
    const tick = () => {
      if (fn() === false) { stop(); return; }
      delay = Math.max(55, delay * 0.78);
      t.current = setTimeout(tick, delay);
    };
    t.current = setTimeout(tick, delay);
  }, [stop]);
  return { start, stop };
}

export default function MarketPanel({ state, derived, actions }) {
  const [tab, setTab] = useState('sell'); // 'sell' | 'buy'
  const buying = tab === 'buy';
  const hold = useHold();
  const stateRef = useRef(state); stateRef.current = state;

  // 길게 누르기 핸들러 (구매/판매), 자금/재고 떨어지면 자동 중단
  const holdBuy = (id, qty) => () => {
    const s = stateRef.current;
    if (s.money < buyPrice(s, id)) return false;
    actions.buyGood(id, qty);
  };
  const holdSell = (id, qty) => () => {
    const s = stateRef.current;
    if ((s.inventory[id] || 0) <= 0) return false;
    actions.sellGood(id, qty);
  };
  const press = (fn) => ({
    onPointerDown: () => hold.start(fn),
    onPointerUp: hold.stop,
    onPointerLeave: hold.stop,
    onPointerCancel: hold.stop,
  });

  return (
    <div className="market">
      <div className="market-tabs">
        <button className={'mk-tab' + (!buying ? ' on' : '')} onClick={() => setTab('sell')}>💰 판매</button>
        <button className={'mk-tab' + (buying ? ' on' : '')} onClick={() => setTab('buy')}>🛒 구매</button>
      </div>
      <p className="hint">
        {buying
          ? '필요한 재화를 시세 + 상점 마진으로 구매합니다. 버튼을 길게 누르면 연속 구매됩니다.'
          : '생산물 가격은 매일 변동합니다. 비쌀 때 파세요! 많이 팔면 시세가 잠시 내려갑니다.'}
        {!buying && derived.sellMult > 1 &&
          ` (판매 +${Math.round((derived.sellMult - 1) * 100)}%)`}
      </p>

      <table className="market-table">
        <thead>
          <tr>
            <th>재화</th>
            <th>기본가</th>
            <th>{buying ? '구매가' : '현재가'}</th>
            <th>보유</th>
            <th>{buying ? '구매' : '판매'}</th>
          </tr>
        </thead>
        <tbody>
          {GOODS_LIST.map((g) => {
            const have = state.inventory[g.id] || 0;
            const price = buying ? buyPrice(state, g.id) : sellPrice(state, g.id, derived);
            const up = price > g.basePrice;
            const canBuy1 = state.money >= price;
            return (
              <tr key={g.id} className={buying || have > 0 ? '' : 'dim'}>
                <td>{g.icon} {g.name}</td>
                <td className="num">{g.basePrice}</td>
                <td className={'num ' + (up ? 'up' : 'down')}>
                  {price}{up ? ' ▲' : ' ▼'}
                </td>
                <td className="num">{fmt(have)}</td>
                <td>
                  {buying ? (
                    <div className="sell-btns">
                      <button className="btn-sm" disabled={!canBuy1} {...press(holdBuy(g.id, 1))}>1개</button>
                      <button className="btn-sm" disabled={state.money < price} {...press(holdBuy(g.id, 10))}>10개</button>
                    </div>
                  ) : (
                    <div className="sell-btns">
                      <button className="btn-sm" disabled={have <= 0} {...press(holdSell(g.id, 1))}>1개</button>
                      <button className="btn-sm" disabled={have <= 0} onClick={() => actions.sellGood(g.id, have)}>전량</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
