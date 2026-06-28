// 축산 탭: 가축 구매/처분 + 사료 구매

import { ANIMAL_LIST, ANIMAL_PRODUCTS } from '../../game/livestock';

export default function LivestockPanel({ state, actions }) {
  return (
    <div className="livestock">
      <div className="feed-row">
        <span>🌿 사료 보유: <b>{state.feed}</b></span>
        <span className="feed-buttons">
          <button className="btn-sm" onClick={() => actions.buyFeed(10)}>+10 (20G)</button>
          <button className="btn-sm" onClick={() => actions.buyFeed(50)}>+50 (100G)</button>
        </span>
      </div>

      <p className="hint">
        가축은 매일 사료를 먹고 축산물을 생산합니다. 사료가 떨어지면 생산이 멈춥니다.
      </p>

      <div className="animal-list">
        {ANIMAL_LIST.map((a) => {
          const cell = state.livestock[a.id];
          const product = ANIMAL_PRODUCTS[a.product];
          return (
            <div key={a.id} className="animal-card">
              <div className="animal-head">
                <span className="animal-name">{a.icon} {a.name}</span>
                <span className="animal-count">보유 {cell.count}마리</span>
              </div>
              <div className="animal-detail">
                <small>
                  사료 {a.feedPerDay}/일 · {a.productDays}일마다 {product.icon}{product.name}
                  ({product.basePrice}G)
                </small>
              </div>
              <div className="animal-actions">
                <button className="btn-sm buy" onClick={() => actions.buyAnimal(a.id)}>
                  구입 ({a.buyCost}G)
                </button>
                <button
                  className="btn-sm sell"
                  disabled={cell.count <= 0}
                  onClick={() => actions.sellAnimal(a.id)}
                >
                  처분 (+{Math.round(a.buyCost * 0.5)}G)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
