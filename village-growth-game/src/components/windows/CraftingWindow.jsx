// 제작 창: 레시피 목록 + 재료 보유량 + 제작 버튼

import { RECIPES, itemCount, canCraft } from '../../game/crafting';
import { itemDef, RARITY } from '../../game/items';
import { materialSource } from '../../game/shops';

export default function CraftingWindow({ state, actions }) {
  return (
    <div className="craft">
      <p className="hint">재료를 모아 더 좋은 아이템을 제작하세요. 강화 도구는 장착하면 채집량이 늘어납니다.</p>
      <div className="craft-list">
        {RECIPES.map((r) => {
          const out = itemDef(r.out.id);
          const ok = canCraft(state, r);
          return (
            <div key={r.id} className="craft-card">
              <div className="craft-head">
                <span className="craft-out" style={{ color: RARITY[out.rarity].color }}>{out.icon} {out.name} ×{r.out.qty}</span>
              </div>
              <div className="craft-inputs">
                {r.inputs.map((i) => {
                  const def = itemDef(i.id);
                  const have = itemCount(state, i.id);
                  const src = materialSource(i.id);
                  return (
                    <span key={i.id} className={'craft-mat' + (have >= i.qty ? '' : ' lack')}
                      title={`${def.name} — ${src || '농사·낚시 등으로 획득'}`}>
                      {def.icon} {have}/{i.qty}
                    </span>
                  );
                })}
              </div>
              {/* 재료 수급 안내 */}
              <div className="craft-source">
                {r.inputs.map((i) => {
                  const src = materialSource(i.id);
                  if (!src) return null;
                  const def = itemDef(i.id);
                  return <span key={i.id} className="src-row">{def.icon} {def.name}: {src}</span>;
                })}
              </div>
              <button className="wide-btn" disabled={!ok} onClick={() => actions.craft(r.id)}>제작</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
