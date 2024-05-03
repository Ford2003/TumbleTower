import * as React from 'react';
import {PlayerMenu} from './PlayerMenu';
import {useAuthenticatedContext} from '../hooks/useAuthenticatedContext';
import {usePlayers} from '../hooks/usePlayers';
import './MainMenu.css';
import ReadyUpButton from './ReadyUp';
import StartButton from './StartButton';

interface ButtonProps {
  onStartGame: () => void;
}

export function MainMenu({onStartGame}: ButtonProps) {
  const players = usePlayers();
  const authContext = useAuthenticatedContext();

  const [imagesLoaded, setImagesLoaded] = React.useState(0);
  const [totalImages, setTotalImages] = React.useState(0);

  React.useEffect(() => {
    authContext.room.onMessage('game-started', onStartGame);
    const allImagePaths = ['../block-T-blue.png'];
    setTotalImages(allImagePaths.length);

    allImagePaths.forEach((path) => {
      const image = new Image();
      image.src = path;
      image.onload = () => {
        setImagesLoaded(imagesLoaded + 1);
      };
    });
  }, []);

  return (
    <div className="MainMenu">
      <div className="players__container">
        {players.map((p) => (
          <PlayerMenu key={p.userId} {...p} />
        ))}
      </div>
      <div className="buttons__container">
        <div className="ready__up__button">
          <ReadyUpButton />
        </div>
        <div className="start__button">
          <StartButton />
          <p>
            Images Loaded: {imagesLoaded} / {totalImages}
          </p>
        </div>
        <div>
          <p>
            Use a and d or the arrow keys to move left/right.
          </p>
          <p>
            Use the mouse to rotate.
          </p>
        </div>
      </div>
    </div>
  );
}
