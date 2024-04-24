import {Room, Client} from 'colyseus';
import {TPlayerOptions} from '../entities/Player';
import {State, IState} from '../entities/State';
import {Events, IEvent, Engine, Runner} from 'matter-js';

export class StateHandlerRoom extends Room<State> {
  maxClients = 1000;

  onCreate(options: IState) {
    this.setState(new State(options));

    // Here's where we would add handlers for updating state
    this.onMessage('ready-up', (client, message) => {
      // on player ready up - update player state and check if all players are ready.
      this.state.ready(client.sessionId, message);
      const allReady = Array.from(this.state.players.values()).every((p) => p.ready);
      this.broadcast('all_ready', allReady);
    });

    this.onMessage('start-game-requested', () => {
      this.broadcast('game-started');
      // On game start - create the engine and starting blocks.
      const startBlocks = this.state.startGame();
      // For each block created, broadcast the block to all clients.
      for (const block of startBlocks) {
        this.broadcast('block-created', {block: block});
      }
      this.OnEngineUpdate = this.OnEngineUpdate.bind(this);
      Events.on(this.state.engine, 'afterUpdate', this.OnEngineUpdate);
    });

    this.onMessage('player-input', (client, message: string) => {
      this.state.setPlayerInput(client.sessionId, message);
    });
  }

  OnEngineUpdate(event: IEvent<Engine | null>) {
    // Update the state of the blocks.
    const updates = this.state._calculateBodyDeltas(event);
    // Broadcast the updates to all clients, in chunks of 20 blocks.
    for (let i = 0; i < updates.length; i += 20) {
      this.broadcast('block-updates', updates.slice(i, i + 20));
    }
  }

  onAuth(_client: any, _options: any, _req: any) {
    return true;
  }

  onJoin(client: Client, options: TPlayerOptions) {
    this.state.createPlayer(client.sessionId, options);
  }

  onLeave(client: Client) {
    this.state.removePlayer(client.sessionId);
  }

  onDispose() {
    Engine.clear(this.state.engine);
    Runner.stop(this.state.runner);
    console.log('Dispose StateHandlerRoom');
  }
}
