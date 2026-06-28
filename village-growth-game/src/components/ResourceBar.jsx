// 상단 자원/인구 표시줄

import { RESOURCES } from '../game/config';

function fmtRate(n) {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return '±0';
  return r > 0 ? `+${r}` : `${r}`;
}

export default function ResourceBar({ state, stats }) {
  return (
    <div className="resource-bar">
      {Object.entries(RESOURCES).map(([key, meta]) => {
        const net = stats.net[key];
        return (
          <div className="resource" key={key}>
            <span className="resource-icon">{meta.icon}</span>
            <div className="resource-text">
              <span className="resource-amount">
                {Math.floor(state.resources[key])}
              </span>
              <span
                className={
                  'resource-rate ' + (net >= 0 ? 'rate-pos' : 'rate-neg')
                }
              >
                {fmtRate(net)}/초
              </span>
            </div>
          </div>
        );
      })}

      <div className="resource">
        <span className="resource-icon">👥</span>
        <div className="resource-text">
          <span className="resource-amount">
            {state.population.toFixed(1)} / {stats.maxPop}
          </span>
          <span className="resource-rate">
            일꾼 {stats.workersAvailable}/{stats.workersNeeded}
          </span>
        </div>
      </div>
    </div>
  );
}
