// 시장 탭: 보유 재화 판매 (가격은 매일 변동)

import { GOODS_LIST } from '../../game/goods';
import { sellPrice } from '../../game/engine';
import { fmt } from '../../game/util';

export default function MarketPanel({ state, derived, actions }) {
  return (
    <div className="market">
      <p className="hint">
        생산물 가격은 매일 변동합니다. 비쌀 때 파세요! 판매가에는 시장·상업연구 보너스가 적용됩니다.
        {derived.sellMult > 1 &&
          ` (현재 +${Math.round((derived.sellMult - 1) * 100)}%)`}
      </p>

      <table className="market-table">
        <thead>
          <tr>
            <th>재화</th>
            <th>기본가</th>
            <th>현재가</th>
            <th>보유</th>
            <th>판매</th>
          </tr>
        </thead>
        <tbody>
          {GOODS_LIST.map((g) => {
            const have = state.inventory[g.id] || 0;
            const price = sellPrice(state, g.id, derived);
            const up = price > g.basePrice;
            return (
              <tr key={g.id} className={have > 0 ? '' : 'dim'}>
                <td>{g.icon} {g.name}</td>
                <td className="num">{g.basePrice}</td>
                <td className={'num ' + (up ? 'up' : 'down')}>
                  {price}{up ? ' ▲' : ' ▼'}
                </td>
                <td className="num">{fmt(have)}</td>
                <td>
                  <div className="sell-btns">
                    <button
                      className="btn-sm"
                      disabled={have <= 0}
                      onClick={() => actions.sellGood(g.id, 1)}
                    >
                      1개
                    </button>
                    <button
                      className="btn-sm"
                      disabled={have <= 0}
                      onClick={() => actions.sellGood(g.id, have)}
                    >
                      전량
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
