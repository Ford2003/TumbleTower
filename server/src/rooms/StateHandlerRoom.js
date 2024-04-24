"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateHandlerRoom = void 0;
const colyseus_1 = require("colyseus");
const State_1 = require("../entities/State");
const matter_js_1 = require("matter-js");
class StateHandlerRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 1000;
    }
    onCreate(options) {
        this.setState(new State_1.State(options));
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
                this.broadcast('block-created', { block: block });
            }
            this.OnEngineUpdate = this.OnEngineUpdate.bind(this);
            matter_js_1.Events.on(this.state.engine, 'afterUpdate', this.OnEngineUpdate);
        });
        this.onMessage('player-input', (client, message) => {
            this.state.setPlayerInput(client.sessionId, message);
        });
    }
    OnEngineUpdate(event) {
        // Update the state of the blocks.
        const updates = this.state._calculateBodyDeltas(event);
        // Broadcast the updates to all clients, in chunks of 20 blocks.
        for (let i = 0; i < updates.length; i += 20) {
            this.broadcast('block-updates', updates.slice(i, i + 20));
        }
    }
    onAuth(_client, _options, _req) {
        return true;
    }
    onJoin(client, options) {
        this.state.createPlayer(client.sessionId, options);
    }
    onLeave(client) {
        this.state.removePlayer(client.sessionId);
    }
    onDispose() {
        matter_js_1.Engine.clear(this.state.engine);
        matter_js_1.Runner.stop(this.state.runner);
        console.log('Dispose StateHandlerRoom');
    }
}
exports.StateHandlerRoom = StateHandlerRoom;
