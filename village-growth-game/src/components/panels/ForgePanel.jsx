// 대장간: 장착한 장비를 강화·수리하는 곳
import { GEAR_SLOTS, enhanceCost, enhanceChance, enhanceDowngrades, repairCost, MAX_ENHANCE, gearStats } from '../../game/combat';
import { itemDef, RARITY } from '../../game/items';

export default function ForgePanel({ state, actions }) {
  const equipped = GEAR_SLOTS.filter((s) => state.gear[s.id]);
  const crystal = state.inventory.crystal || 0;
  return (
    <div className="forge">
      <p className="hint">⚒️ 장착한 장비를 강화·수리합니다. 강화는 <b>확률</b>로 성공/실패하며, +4부터는 실패 시 한 단계 <b>하락</b>합니다. 강화엔 골드와 마력 수정(🔮 보유 {crystal})이 필요합니다. (수정은 산 채광/사냥에서 획득)</p>
      {equipped.length === 0 ? (
        <p className="empty">장착한 장비가 없습니다. 인벤토리(🎒)에서 먼저 장착하세요.</p>
      ) : (
        <div className="forge-list">
          {equipped.map((s) => {
            const inst = state.gear[s.id];
            const d = itemDef(inst.id);
            const maxed = inst.enh >= MAX_ENHANCE;
            const ec = enhanceCost(inst.enh);
            const rc = repairCost(d, inst.dur);
            const pct = Math.round(enhanceChance(inst.enh) * 100);
            const risky = enhanceDowngrades(inst.enh);
            const canEnh = !maxed && state.money >= ec.gold && crystal >= ec.crystal;
            // 현재 능력치 & 강화 시 상승폭 (공/방만 강화 반영)
            const cur = gearStats(inst.id, inst.enh);
            const nxt = gearStats(inst.id, inst.enh + 1);
            const stat = [];
            if (d.atk) stat.push(`⚔️ ${cur.atk}`);
            if (d.def) stat.push(`🛡️ ${cur.def}`);
            if (d.hp) stat.push(`❤️ ${cur.hp}`);
            const up = [];
            if (nxt.atk - cur.atk > 0) up.push(`⚔️+${nxt.atk - cur.atk}`);
            if (nxt.def - cur.def > 0) up.push(`🛡️+${nxt.def - cur.def}`);
            return (
              <div key={s.id} className="forge-card">
                <span className="forge-name" style={{ color: RARITY[d.rarity].color }}>
                  {d.icon} {d.name}{inst.enh > 0 ? ` +${inst.enh}` : ''}
                </span>
                <span className="forge-stat">{stat.join(' · ') || '능력치 없음'}{!maxed && up.length > 0 && <>　→ 강화 시 <b className="ok">{up.join(' ')}</b></>}</span>
                <span className="forge-meta">
                  {d.maxDur ? `내구 ${inst.dur}/${d.maxDur}` : '내구 없음'}
                  {!maxed && <> · 성공률 <b className={pct >= 60 ? 'ok' : 'lack'}>{pct}%</b>{risky && ' · 실패 시 하락'}</>}
                </span>
                <div className="forge-btns">
                  {maxed ? (
                    <button className="btn-sm" disabled>최대 강화 +{MAX_ENHANCE}</button>
                  ) : (
                    <button className="btn-sm buy" disabled={!canEnh} onClick={() => actions.enhance(s.id)}>
                      강화+{inst.enh + 1} ({pct}% · 💰{ec.gold} 🔮{ec.crystal})
                    </button>
                  )}
                  {d.maxDur > 0 && inst.dur < d.maxDur && (
                    <button className="btn-sm" disabled={state.money < rc} onClick={() => actions.repair(s.id)}>수리 (💰{rc})</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
