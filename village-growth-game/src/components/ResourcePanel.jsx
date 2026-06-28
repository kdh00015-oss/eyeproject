// 좌측: 자원 현황 (골드, 인구, 행복도, 영향력, 사료, 저장 한도, 보유 재화)

import { GOODS } from '../game/goods';
import { fmt } from '../game/util';
import { SKILLS, skillLevel, skillBonus } from '../game/skills';
import { CLASSES } from '../game/classes';

export default function ResourcePanel({ state, derived }) {
  // 보유 중인(1개 이상) 재화만 표시
  const owned = Object.values(GOODS)
    .filter((g) => (state.inventory[g.id] || 0) > 0)
    .map((g) => ({ ...g, qty: state.inventory[g.id] }));
  const cls = CLASSES[state.class];
  const skills = state.skills || {};

  return (
    <aside className="panel resource-panel">
      <h2 className="panel-title">📊 자원 현황</h2>

      <div className="stat-grid">
        <Stat icon="💰" label="골드" value={fmt(Math.floor(state.money))} />
        <Stat
          icon="👥"
          label="인구"
          value={`${Math.floor(state.population)}/${derived.maxPop}`}
        />
        <Stat icon="😊" label="행복도" value={`${Math.round(state.happiness)}%`} />
        <Stat icon="⭐" label="영향력" value={fmt(Math.floor(state.influence))} />
        <Stat icon="🌿" label="사료" value={fmt(state.feed)} />
        <Stat
          icon="📦"
          label="저장"
          value={`${Math.floor(derived.stored)}/${derived.storageCap}`}
        />
      </div>

      <div className="happiness-bar">
        <div
          className="happiness-fill"
          style={{
            width: `${state.happiness}%`,
            background:
              state.happiness > 60 ? '#6dd36d' : state.happiness > 35 ? '#f4c542' : '#e0604a',
          }}
        />
      </div>

      <h3 className="sub-title">🧭 생활 스킬{cls ? ` · ${cls.icon} ${cls.name}` : ''}</h3>
      <ul className="skill-list">
        {SKILLS.map((sk) => {
          const xp = skills[sk.id] || 0;
          const lv = skillLevel(xp);
          const pct = lv >= 100 ? 100 : Math.round(((xp % 120) / 120) * 100);
          return (
            <li key={sk.id} className="skill-row" title={`${sk.name} Lv.${lv} · 보너스 +${Math.round((skillBonus(xp) - 1) * 100)}%`}>
              <span className="skill-name">{sk.icon} {sk.name}</span>
              <span className="skill-bar"><span className="skill-fill" style={{ width: `${pct}%` }} /></span>
              <span className="skill-lv">Lv.{lv}</span>
            </li>
          );
        })}
      </ul>

      <h3 className="sub-title">🎒 보유 재화</h3>
      {owned.length === 0 ? (
        <p className="empty">아직 보유한 생산물이 없습니다.</p>
      ) : (
        <ul className="goods-list">
          {owned.map((g) => (
            <li key={g.id}>
              <span>{g.icon} {g.name}</span>
              <span className="qty">{fmt(g.qty)}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
