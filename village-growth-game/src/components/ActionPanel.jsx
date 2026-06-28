// 중앙: 탭으로 구분된 주요 행동 영역

import { useState } from 'react';
import FarmPanel from './panels/FarmPanel';
import FishingPanel from './panels/FishingPanel';
import LivestockPanel from './panels/LivestockPanel';
import BuildPanel from './panels/BuildPanel';
import ResearchPanel from './panels/ResearchPanel';
import MarketPanel from './panels/MarketPanel';
import TradePanel from './panels/TradePanel';

const TABS = [
  { id: 'farm', label: '🌾 농사', C: FarmPanel },
  { id: 'fishing', label: '🎣 낚시', C: FishingPanel },
  { id: 'livestock', label: '🐮 축산', C: LivestockPanel },
  { id: 'build', label: '🏗️ 건설', C: BuildPanel },
  { id: 'research', label: '🔬 연구', C: ResearchPanel },
  { id: 'market', label: '💹 시장', C: MarketPanel },
  { id: 'trade', label: '🤝 교역', C: TradePanel },
];

export default function ActionPanel({ state, derived, time, actions }) {
  const [tab, setTab] = useState('farm');
  const Active = TABS.find((t) => t.id === tab).C;

  return (
    <section className="panel action-panel">
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="tab-body">
        <Active state={state} derived={derived} time={time} actions={actions} />
      </div>
    </section>
  );
}
