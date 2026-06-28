import './App.css';
import { useGame } from './hooks/useGame';
import GameCanvas from './components/GameCanvas';

export default function App() {
  const game = useGame();
  return <GameCanvas {...game} onSave={game.save} />;
}
