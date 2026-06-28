// 마을 격자: 타일 클릭으로 건설/철거

import { GRID_SIZE, BUILDINGS } from '../game/config';
import { canAfford } from '../game/engine';

export default function VillageGrid({ state, selected, onTileClick }) {
  return (
    <div
      className="village-grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {state.grid.map((cell, index) => {
        const building = cell ? BUILDINGS[cell] : null;
        const isDemolishMode = selected === 'demolish';
        const buildable =
          selected && selected !== 'demolish' && BUILDINGS[selected];

        let cls = 'tile';
        if (cell) cls += ' occupied';
        if (!cell && buildable) {
          cls += canAfford(state.resources, buildable.cost)
            ? ' targetable'
            : ' blocked';
        }
        if (cell && isDemolishMode) cls += ' demolishable';

        return (
          <button
            key={index}
            className={cls}
            onClick={() => onTileClick(index)}
            title={building ? building.name : '빈 땅'}
          >
            {building ? building.icon : ''}
          </button>
        );
      })}
    </div>
  );
}
