// 농사 탭: 밭 칸 표시 + 파종/수확 + 개간

import { useState } from 'react';
import { CROPS, CROP_LIST } from '../../game/crops';
import { FARM_PLOTS_MAX, RECLAIM_BASE_COST } from '../../game/constants';

export default function FarmPanel({ state, time, actions }) {
  const [selected, setSelected] = useState('wheat');

  const reclaimCost = RECLAIM_BASE_COST * (state.farm.length - 8);
  const canReclaim = state.farm.length < FARM_PLOTS_MAX;

  return (
    <div className="farm">
      <div className="crop-picker">
        {CROP_LIST.map((c) => {
          const plantable = c.seasons.includes(time.season.id);
          return (
            <button
              key={c.id}
              className={
                'crop-chip' +
                (selected === c.id ? ' active' : '') +
                (plantable ? '' : ' off')
              }
              onClick={() => setSelected(c.id)}
              title={plantable ? '' : `${time.season.name}에는 심을 수 없음`}
            >
              {c.icon} {c.name}
              <small>씨앗 {c.seedCost}G · {c.growthDays}일 · {c.yield}개</small>
            </button>
          );
        })}
      </div>

      <p className="hint">
        작물을 고른 뒤 빈 밭을 클릭하면 파종됩니다. 다 자란 밭(✅)을 클릭하면 수확합니다.
        현재 계절: {time.season.icon} {time.season.name}
      </p>

      <div className="plot-grid">
        {state.farm.map((plot, i) => {
          if (!plot) {
            return (
              <button
                key={i}
                className="plot empty"
                onClick={() => actions.plant(i, selected)}
              >
                <span className="plot-soil">🟫</span>
                <small>빈 밭</small>
              </button>
            );
          }
          const crop = CROPS[plot.cropId];
          const age = state.day - plot.plantedDay;
          const ready = age >= crop.growthDays;
          const pct = Math.min(100, Math.round((age / crop.growthDays) * 100));
          return (
            <button
              key={i}
              className={'plot' + (ready ? ' ready' : '')}
              onClick={() => ready && actions.harvest(i)}
            >
              <span className="plot-soil">{crop.icon}</span>
              <small>{ready ? '✅ 수확!' : `${pct}%`}</small>
              {!ready && (
                <span className="grow-bar">
                  <span className="grow-fill" style={{ width: `${pct}%` }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="wide-btn"
        disabled={!canReclaim}
        onClick={actions.reclaim}
      >
        {canReclaim ? `🪓 밭 개간 (${reclaimCost}G)` : '밭이 최대치입니다'}
      </button>
    </div>
  );
}
