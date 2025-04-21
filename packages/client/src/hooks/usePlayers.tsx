import * as React from 'react';
import {Player as PlayerState} from '../../../server/src/entities/Player';
import {useAuthenticatedContext} from './useAuthenticatedContext';
import {getStateCallbacks} from "colyseus.js";

const PlayersContext = React.createContext<PlayerState[]>([]);

export function PlayersContextProvider({children}: {children: React.ReactNode}) {
  const players = usePlayersContextSetup();

  return <PlayersContext.Provider value={players}>{children}</PlayersContext.Provider>;
}

export function usePlayers() {
  return React.useContext(PlayersContext);
}

/**
 * This hook sets up listeners for each player so that their state is kept up to date and can be consumed elsewhere in the app
 * One improvement worth considering is using a map instead of an array
 */
function usePlayersContextSetup() {
  const [players, setPlayers] = React.useState<PlayerState[]>([]);

  const authenticatedContext = useAuthenticatedContext();

  React.useEffect(() => {
    try {
      const stateCallbacks = getStateCallbacks(authenticatedContext.room);
      stateCallbacks(authenticatedContext.room.state).players.onAdd((player, _key) => {
        setPlayers((players) => [...players.filter((p) => p.userId !== player.userId), player]);
        function handlePropertyChange(field: string, value: unknown) {
          setPlayers((players) =>
            players.map((p) => {
              if (p.userId !== player.userId) {
                return p;
              }
              // @ts-expect-error
              p[field] = value;
              return p;
            }),
          );
        }

        // there is likely a more clever way to do this
        stateCallbacks(player).listen('avatarUri', (value) => handlePropertyChange('avatarUri', value));
        stateCallbacks(player).listen('name', (value) => handlePropertyChange('name', value));
        stateCallbacks(player).listen('sessionId', (value) => handlePropertyChange('sessionId', value));
        stateCallbacks(player).listen('ready', (value) => handlePropertyChange('ready', value));
        stateCallbacks(player).listen('userId', (value) => handlePropertyChange('userId', value));
      });

      stateCallbacks(authenticatedContext.room.state).players.onRemove((player, _key) => {
        setPlayers((players) => [...players.filter((p) => p.userId !== player.userId)]);
      });

      authenticatedContext.room.onLeave((code) => {
        console.log("You've been disconnected.", code);
      });
    } catch (e) {
      console.error("Couldn't connect:", e);
    }
  }, [authenticatedContext.room]);

  return players;
}
