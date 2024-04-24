import * as React from 'react';
import {useAuthenticatedContext} from '../hooks/useAuthenticatedContext';
import './ReadyUp.css';

function ReadyUpButton() {
  const [isReady, setIsReady] = React.useState(false); // Client-side ready state
  const authenticatedContext = useAuthenticatedContext(); // Get context

  const handleReadyUp = () => {
    setIsReady(!isReady); // Toggle ready state
  };

  React.useEffect(() => {
    // send ready event to colyseus server
    authenticatedContext.room.send('ready-up', isReady);
    console.log('Ready up', isReady);
  }, [isReady, authenticatedContext.room]);

  return (
    <button className={`ready__up__button ${isReady ? 'ready' : ''}`} onClick={handleReadyUp}>
      {isReady ? 'Ready' : 'Ready Up'}
    </button>
  );
}

export default ReadyUpButton;
