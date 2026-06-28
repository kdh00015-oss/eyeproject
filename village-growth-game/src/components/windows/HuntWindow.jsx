// 사냥/전투: 지역 선택 → 턴제 전투(공격/스킬/회피/물약/도망) → 드롭

import { useState } from 'react';
import { ZONES, playerStats, rollDrops } from '../../game/combat';
import { itemDef } from '../../game/items';
import { itemCount } from '../../game/crafting';

export default function HuntWindow({ state, actions }) {
  const stats = playerStats(state);
  const [fight, setFight] = useState(null); // { zone, mon, monHp, hp, log[], skillCd, dodge, phase }

  const start = (zone, boss) => {
    const mon = boss ? zone.boss : zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
    setFight({ zone, mon: { ...mon }, monHp: mon.hp, hp: stats.hpMax, log: [`${mon.icon} ${mon.name}이(가) 나타났다!`], skillCd: 0, dodge: false, phase: 'fight' });
  };

  const act = (kind) => {
    setFight((f) => {
      if (!f || f.phase !== 'fight') return f;
      let { monHp, hp, skillCd } = f;
      const log = [...f.log];
      let dodging = false;
      if (kind === 'attack') {
        const dmg = Math.max(1, Math.round(stats.atk * (0.9 + Math.random() * 0.2)) - f.mon.def);
        monHp -= dmg; log.unshift(`나의 공격! ${dmg} 피해`);
      } else if (kind === 'skill') {
        if (skillCd > 0) { log.unshift('스킬 재사용 대기 중'); return { ...f, log }; }
        const dmg = Math.max(1, Math.round(stats.atk * 1.8) - f.mon.def);
        monHp -= dmg; skillCd = 2; log.unshift(`💥 강타! ${dmg} 피해`);
      } else if (kind === 'dodge') {
        dodging = true; log.unshift('🌀 회피 자세를 취했다');
      } else if (kind === 'potion') {
        if (itemCount(state, 'potion') <= 0) { log.unshift('치유 물약이 없다'); return { ...f, log }; }
        actions.useItem('potion'); hp = Math.min(stats.hpMax, hp + 40); log.unshift('🧪 물약 사용! +40 체력');
      }
      // 승리 체크
      if (monHp <= 0) {
        const drops = rollDrops(f.mon);
        actions.combatResult({ drops, gold: f.mon.gold, exp: f.mon.exp, durLoss: 2, label: f.mon.name });
        const dl = drops.length ? drops.map((d) => `${itemDef(d.id).icon}${d.qty}`).join(' ') : '없음';
        log.unshift(`🏆 승리! 💰${f.mon.gold} ✨${f.mon.exp} 드롭: ${dl}`);
        return { ...f, monHp: 0, log, phase: 'win' };
      }
      // 몬스터 반격
      if (skillCd > 0 && kind !== 'skill') skillCd -= 1;
      let nhp = hp;
      if (dodging && Math.random() < 0.7) { log.unshift('적의 공격을 회피했다!'); }
      else { const md = Math.max(1, f.mon.atk - stats.def); nhp -= md; log.unshift(`${f.mon.name}의 공격! ${md} 피해`); }
      if (nhp <= 0) { log.unshift('💀 기절했다... 마을로 돌아간다.'); return { ...f, hp: 0, monHp, log, skillCd, phase: 'lose' }; }
      return { ...f, monHp, hp: nhp, log, skillCd, dodge: false };
    });
  };

  if (fight) {
    const monPct = Math.max(0, Math.round((fight.monHp / fight.mon.hp) * 100));
    const hpPct = Math.max(0, Math.round((fight.hp / stats.hpMax) * 100));
    return (
      <div className="hunt">
        <div className="battle">
          <div className="battler">
            <div className="bt-icon">{fight.mon.icon}</div>
            <div className="bt-name">{fight.mon.name}{fight.mon.boss ? ' 👑' : ''}</div>
            <div className="bt-bar"><div className="bt-fill mon" style={{ width: `${monPct}%` }} /></div>
            <div className="bt-hp">{Math.max(0, fight.monHp)}/{fight.mon.hp}</div>
          </div>
          <div className="vs">VS</div>
          <div className="battler">
            <div className="bt-icon">🧑‍🌾</div>
            <div className="bt-name">나 (Lv.{state.level})</div>
            <div className="bt-bar"><div className="bt-fill me" style={{ width: `${hpPct}%` }} /></div>
            <div className="bt-hp">{Math.max(0, Math.round(fight.hp))}/{stats.hpMax}</div>
          </div>
        </div>

        {fight.phase === 'fight' ? (
          <div className="battle-actions">
            <button className="btn-sm buy" onClick={() => act('attack')}>⚔️ 공격</button>
            <button className="btn-sm" disabled={fight.skillCd > 0} onClick={() => act('skill')}>💥 강타{fight.skillCd > 0 ? `(${fight.skillCd})` : ''}</button>
            <button className="btn-sm" onClick={() => act('dodge')}>🌀 회피</button>
            <button className="btn-sm" onClick={() => act('potion')}>🧪 물약({itemCount(state, 'potion')})</button>
            <button className="btn-sm sell" onClick={() => setFight(null)}>🏃 도망</button>
          </div>
        ) : (
          <div className="battle-actions">
            <button className="wide-btn" onClick={() => setFight(null)}>{fight.phase === 'win' ? '계속' : '마을로 돌아가기'}</button>
          </div>
        )}

        <ul className="battle-log">
          {fight.log.slice(0, 8).map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="hunt">
      <div className="hunt-stats">⚔️ {stats.atk} · 🛡️ {stats.def} · ❤️ {stats.hpMax} · 🧪 {itemCount(state, 'potion')}</div>
      <p className="hint">사냥 지역에 들어가 몬스터를 처치하고 재료·장비를 획득하세요. 장비를 갖추고 도전하세요!</p>
      <div className="zone-list">
        {ZONES.map((z) => {
          const locked = state.level < z.unlock;
          return (
            <div key={z.id} className={'zone-card' + (locked ? ' locked' : '')}>
              <div className="zone-head"><span className="zone-name">{z.icon} {z.name}</span>
                <span className="muted">{locked ? `Lv.${z.unlock} 필요` : `일반/보스`}</span></div>
              <div className="zone-mons">{z.monsters.map((m) => `${m.icon}${m.name}`).join(' · ')} · 보스 {z.boss.icon}{z.boss.name}</div>
              <div className="zone-btns">
                <button className="btn-sm buy" disabled={locked} onClick={() => start(z, false)}>사냥</button>
                <button className="btn-sm sell" disabled={locked} onClick={() => start(z, true)}>보스 도전</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
