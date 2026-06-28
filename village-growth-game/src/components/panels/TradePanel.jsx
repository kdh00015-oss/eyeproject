// 교역 탭: 마을 탐험 + 교역로 개설 + 세율 조정

import { VILLAGE_TEMPLATES, EXPLORE_BASE_COST } from '../../game/constants';

export default function TradePanel({ state, derived, actions }) {
  const discoveredCount = state.villages.filter((v) => v.discovered).length;
  const allFound = discoveredCount >= state.villages.length;
  const exploreCost = EXPLORE_BASE_COST * (discoveredCount + 1);

  return (
    <div className="trade">
      {/* 세율 조정 */}
      <div className="tax-box">
        <h3 className="sub-title">📜 세율: {state.taxRate}%</h3>
        <p className="hint">
          세율이 높으면 세수가 늘지만 행복도가 떨어집니다.
        </p>
        <input
          type="range"
          min="0"
          max="40"
          value={state.taxRate}
          onChange={(e) => actions.setTax(Number(e.target.value))}
        />
      </div>

      {/* 탐험 */}
      <div className="explore-box">
        <button
          className="wide-btn"
          disabled={allFound || state.money < exploreCost}
          onClick={actions.explore}
        >
          {allFound ? '모든 마을을 발견했습니다' : `🧭 새 마을 탐험 (${exploreCost}G)`}
        </button>
        {state.buildings.port < 1 && (
          <p className="warn-box">⚠️ 교역로 개설에는 항구(⚓)가 필요합니다.</p>
        )}
      </div>

      {/* 발견한 마을 + 교역 */}
      <div className="village-cards">
        {state.villages.map((v) => {
          if (!v.discovered) {
            return (
              <div key={v.id} className="village-card hidden">
                <span>❓ 미발견 마을</span>
              </div>
            );
          }
          const tpl = VILLAGE_TEMPLATES.find((t) => t.id === v.id);
          return (
            <div key={v.id} className="village-card">
              <div className="village-head">
                <span className="village-name">🏘️ {tpl.name}</span>
                <span className="muted">거리 {tpl.distance}</span>
              </div>
              <small>
                일일 교역수익 {tpl.tradeIncome}G · 영향력 +{tpl.influence}
              </small>
              {v.tradeOpen ? (
                <div className="trade-open">✅ 교역 중 (수익 ×{derived.tradeMult.toFixed(2)})</div>
              ) : (
                <button
                  className="wide-btn"
                  disabled={state.buildings.port < 1 || state.money < tpl.openCost}
                  onClick={() => actions.openTrade(v.id)}
                >
                  🤝 교역로 개설 ({tpl.openCost}G)
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
