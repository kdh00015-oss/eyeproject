// 무기상점: 무기·방어구·도구를 골드로 구입
import { ARMORY_STOCK } from '../../game/shops';
import { itemDef, RARITY } from '../../game/items';

function gearStat(d) {
  const p = [];
  if (d.atk) p.push(`공+${d.atk}`);
  if (d.def) p.push(`방+${d.def}`);
  if (d.hp) p.push(`체+${d.hp}`);
  if (!p.length && d.slot === 'tool') return '채집 도구';
  return p.join(' ');
}

export default function ArmoryPanel({ state, actions }) {
  return (
    <div className="armory">
      <p className="hint">🛡️ 무기·방어구를 골드로 구입합니다. 구입한 장비는 인벤토리(🎒)에서 장착하세요.</p>
      <div className="armory-grid">
        {ARMORY_STOCK.map((e) => {
          const d = itemDef(e.id);
          const owned = state.inventory[e.id] || 0;
          return (
            <div key={e.id} className="armory-card">
              <span className="armory-icon" style={{ color: RARITY[d.rarity].color }}>{d.icon}</span>
              <span className="armory-name">{d.name}</span>
              <span className="armory-stat">{gearStat(d)}</span>
              <button className="btn-sm buy" disabled={state.money < e.price} onClick={() => actions.buyItem(e.id)}>
                {e.price}G{owned ? ` ·보유${owned}` : ''}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
