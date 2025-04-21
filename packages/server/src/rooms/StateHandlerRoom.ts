import {Room, Client} from 'colyseus';
import {TPlayerOptions} from '../entities/Player';
import {State, IState} from '../entities/State';
import {Events, IEvent, Engine, Runner, IEventCollision} from 'matter-js';

export class StateHandlerRoom extends Room<State> {
  maxClients = 1000;
  patchRate = 1000 / 120; // 120FPS sent to the client

  onCreate(options: IState) {
    this.state = new State(options);

    this.onMessage('ready-up', (client, message) => {
      // on player ready up - update player state and check if all players are ready.
      this.state.ready(client.sessionId, message);
      const allReady = Array.from(this.state.players.values()).every((p) => p.ready);
      this.broadcast('all_ready', allReady);
    });

    this.onMessage('start-game-requested', () => {
      this.broadcast('game-started');
      // wait 1 seconds before creating the initial blocks for the client to load in the game screen
      // TODO: Add use message 'loaded-in' from client to determine when every player is loaded in to start the game.
      this.clock.setTimeout(this.setupBlocks.bind(this), 1000);
    });

    this.onMessage('player-input', (client, message: string) => {
      this.state.setPlayerInput(client.sessionId, message);
    });
  }

  setupBlocks() {
    // On game start - create the engine and starting blocks and add event listeners.
    Events.on(this.state.engine, 'beforeUpdate', this.applyPlayerMovement.bind(this));
    Events.on(this.state.engine, 'afterUpdate', this.onEngineUpdate.bind(this));
    Events.on(this.state.engine, 'collisionStart', this.onEngineCollision.bind(this));

    this.state.startGame();
  }

  applyPlayerMovement() {
    return this.state.applyPlayerMovementAndGravity();
  }

  onEngineUpdate(event: IEvent<Engine | null>) {
    // Update the state of the blocks.
    this.state.updateBodyPositions(event);
  }

  onEngineCollision(event: IEventCollision<Engine>) {
    this.state.handleCollisions(event);
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
