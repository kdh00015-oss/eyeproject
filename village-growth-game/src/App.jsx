import './App.css';
import { useGame } from './hooks/useGame';
import TopBar from './components/TopBar';
import ResourcePanel from './components/ResourcePanel';
import ActionPanel from './components/ActionPanel';
import InfoPanel from './components/InfoPanel';
import LogPanel from './components/LogPanel';

export default function App() {
  const { state, derived, time, actions, speedId, setSpeedId, save } = useGame();

  const handleSave = () => {
    save();
    // 간단한 피드백
    window.alert('💾 저장했습니다!');
  };

  const handleNewGame = () => {
    if (window.confirm('정말 새로 시작할까요? 현재 마을 진행 상황이 사라집니다.')) {
      actions.newGame();
    }
  };

  return (
    <div className="app">
      <TopBar
        state={state}
        derived={derived}
        time={time}
        speedId={speedId}
        setSpeedId={setSpeedId}
        onSave={handleSave}
        onNewGame={handleNewGame}
      />

      <div className="layout">
        <ResourcePanel state={state} derived={derived} />
        <ActionPanel state={state} derived={derived} time={time} actions={actions} />
        <InfoPanel state={state} derived={derived} />
      </div>

      <LogPanel log={state.log} />
    </div>
  );
}
