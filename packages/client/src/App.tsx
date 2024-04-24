import * as React from 'react';
import {AuthenticatedContextProvider} from './hooks/useAuthenticatedContext';
import {PlayersContextProvider} from './hooks/usePlayers';
import {MainMenu} from './components/MainMenu';
import {Game} from './components/GameScreen';

export default function App() {
  const [gameState, setGameState] = React.useState('mainMenu');
  const handleGameState = () => {
    setGameState('game');
  };
  return (
    <AuthenticatedContextProvider>
      <PlayersContextProvider>
        {gameState === 'mainMenu' ? <MainMenu onStartGame={handleGameState} /> : <Game />}
      </PlayersContextProvider>
    </AuthenticatedContextProvider>
  );
}
