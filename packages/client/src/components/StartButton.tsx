import * as React from 'react';
import {useAuthenticatedContext} from '../hooks/useAuthenticatedContext';
import './StartButton.css';

function StartButton() {
  const authenticatedContext = useAuthenticatedContext();
  // Client-side ready state
  const [allReady, setAllReady] = React.useState(false);
  React.useEffect(() => {
    const handleAllReady = (allReady: boolean) => setAllReady(allReady);
    authenticatedContext.room.onMessage('all_ready', handleAllReady);
  }, [authenticatedContext.room]);

  function handleButtonClicked() {
    authenticatedContext.room.send('start-game-requested');
  }

  return (
    <button className={`start-button ${allReady ? 'enabled' : ''}`} disabled={!allReady} onClick={handleButtonClicked}>
      Start Game
    </button>
  );
}

export default StartButton;
