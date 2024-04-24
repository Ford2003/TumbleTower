import * as React from 'react';
import {Player as PlayerState} from '../../../server/src/entities/Player';
import {useAuthenticatedContext} from './useAuthenticatedContext';

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
      authenticatedContext.room.state.players.onAdd = function (player, _key) {
        setPlayers((players) => [...players, player]);
        player.onChange = function (changes) {
          setPlayers((players) =>
            players.map((p) => {
              if (p.userId !== player.userId) {
                return p;
              }
              changes.forEach(({field, value}) => {
                // @ts-expect-error
                p[field] = value;
              });
              return p;
            })
          );
        };
      };

      authenticatedContext.room.state.players.onRemove = function (player, _key) {
        setPlayers((players) => [...players.filter((p) => p.userId !== player.userId)]);
      };

      authenticatedContext.room.onLeave((code) => {
        console.log("You've been disconnected.", code);
      });
    } catch (e) {
      console.error("Couldn't connect:", e);
    }
  }, [authenticatedContext.room]);

  return players;
}
