// 시장 탭: 보유 재화 판매 (가격은 매일 변동)

import { useState } from 'react';
import { GOODS_LIST } from '../../game/goods';
import { sellPrice, buyPrice } from '../../game/engine';
import { fmt } from '../../game/util';

export default function MarketPanel({ state, derived, actions }) {
  const [tab, setTab] = useState('sell'); // 'sell' | 'buy'
  const buying = tab === 'buy';
  return (
    <div className="market">
      <div className="market-tabs">
        <button className={'mk-tab' + (!buying ? ' on' : '')} onClick={() => setTab('sell')}>💰 판매</button>
        <button className={'mk-tab' + (buying ? ' on' : '')} onClick={() => setTab('buy')}>🛒 구매</button>
      </div>
      <p className="hint">
        {buying
          ? '필요한 재화를 시세 + 상점 마진으로 구매합니다. 상인 직업은 구매가가 저렴합니다.'
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
                      <button className="btn-sm" disabled={!canBuy1} onClick={() => actions.buyGood(g.id, 1)}>1개</button>
                      <button className="btn-sm" disabled={state.money < price} onClick={() => actions.buyGood(g.id, 10)}>10개</button>
                    </div>
                  ) : (
                    <div className="sell-btns">
                      <button className="btn-sm" disabled={have <= 0} onClick={() => actions.sellGood(g.id, 1)}>1개</button>
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
