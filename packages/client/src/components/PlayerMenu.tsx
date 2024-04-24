import * as React from 'react';
import {TPlayerOptions} from '../../../server/src/entities/Player';
import './PlayerMenu.css';

export function PlayerMenu({avatarUri, name, ready}: TPlayerOptions) {
  return (
    <div className="player__container">
      <div className={`player__avatar`}>
        <img className="player__avatar__img" src={avatarUri} width="100%" height="100%" />
      </div>
      <div className="player__name">
        {name} - {ready ? 'Ready' : 'Not Ready'}
      </div>
    </div>
  );
}
