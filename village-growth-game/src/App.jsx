import { useState, useCallback } from 'react';
import './App.css';
import { useVillage } from './hooks/useVillage';
import { BUILDINGS } from './game/config';
import { canAfford } from './game/engine';
import ResourceBar from './components/ResourceBar';
import BuildMenu from './components/BuildMenu';
import VillageGrid from './components/VillageGrid';

export default function App() {
  const { state, stats, gather, build, demolish, saveNow, newGame } =
    useVillage();
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  }, []);

  const handleTileClick = useCallback(
    (index) => {
      if (selected === 'demolish') {
        if (state.grid[index]) demolish(index);
        else flash('철거할 건물이 없습니다.');
        return;
      }
      if (!selected) {
        flash('먼저 건설 메뉴에서 건물을 선택하세요.');
        return;
      }
      if (state.grid[index]) {
        flash('이미 건물이 있는 칸입니다.');
        return;
      }
      if (!canAfford(state.resources, BUILDINGS[selected].cost)) {
        flash('자원이 부족합니다.');
        return;
      }
      build(index, selected);
    },
    [selected, state.grid, state.resources, build, demolish, flash]
  );

  const handleSave = () => {
    saveNow();
    flash('💾 저장 완료!');
  };

  const handleNewGame = () => {
    if (window.confirm('정말 새로 시작할까요? 현재 마을은 사라집니다.')) {
      newGame();
      setSelected(null);
      flash('🌱 새 마을을 시작합니다!');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏡 마을 키우기</h1>
        <div className="header-actions">
          <button className="btn" onClick={handleSave}>
            💾 저장
          </button>
          <button className="btn btn-danger" onClick={handleNewGame}>
            🌱 새 게임
          </button>
        </div>
      </header>

      <ResourceBar state={state} stats={stats} />

      <div className="gather-row">
        <button className="gather-btn" onClick={() => gather('wood', 1)}>
          🪓 나무 베기 <span>+1</span>
        </button>
        <button className="gather-btn" onClick={() => gather('food', 1)}>
          🌾 식량 채집 <span>+1</span>
        </button>
        <button className="gather-btn" onClick={() => gather('gold', 1)}>
          💰 금화 줍기 <span>+1</span>
        </button>
      </div>

      <main className="game-main">
        <VillageGrid
          state={state}
          selected={selected}
          onTileClick={handleTileClick}
        />
        <BuildMenu
          selected={selected}
          onSelect={setSelected}
          resources={state.resources}
        />
      </main>

      <footer className="app-footer">
        {stats.efficiency < 1 && (
          <span className="warn">
            ⚠️ 일꾼이 부족해 생산 효율이 {Math.round(stats.efficiency * 100)}%
            입니다. 오두막을 지어 인구를 늘리세요.
          </span>
        )}
        {state.resources.food < 1 && stats.net.food < 0 && (
          <span className="warn">⚠️ 식량 부족! 곧 인구가 줄어듭니다.</span>
        )}
        <span className="autosave">
          자동 저장 켜짐 · 진행은 자동으로 보관됩니다
        </span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
