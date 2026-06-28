import './App.css';
import { useGame } from './hooks/useGame';
import GameCanvas from './components/GameCanvas';

export default function App() {
  const { state, derived, time, actions, save } = useGame();

  return (
    <GameCanvas
      state={state}
      derived={derived}
      time={time}
      actions={actions}
      onSave={() => { save(); }}
    />
  );
}
