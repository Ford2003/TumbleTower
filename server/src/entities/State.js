"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
const schema_1 = require("@colyseus/schema");
const Player_1 = require("./Player");
const matter_js_1 = require("matter-js");
const Block_1 = require("../../../client/src/components/Block");
const getRandomBlock_1 = require("../../../client/src/utils/getRandomBlock");
class State extends schema_1.Schema {
    // Init
    constructor(attributes) {
        super();
        this.players = new schema_1.MapSchema();
        this.engine = matter_js_1.Engine.create();
        this.runner = matter_js_1.Runner.create();
        // Map of controlled blocks key = sessionId, value = Controlled Block Id
        this.controlledBlocks = new Map();
        this.blockPositions = new Map();
        // Store player input to add onto block movement. key = blockId, value = block movement xy delta
        this.playerInputDelta = new Map();
        this.roomName = attributes.roomName;
        this.channelId = attributes.channelId;
        this._calculateBodyDeltas = this._calculateBodyDeltas.bind(this);
        this.applyPlayerMovement = this.applyPlayerMovement.bind(this);
        this._handleCollisions = this._handleCollisions.bind(this);
    }
    _getPlayer(sessionId) {
        return Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
    }
    createPlayer(sessionId, playerOptions) {
        const existingPlayer = Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
        if (existingPlayer == null) {
            this.players.set(playerOptions.userId, new Player_1.Player(Object.assign(Object.assign({}, playerOptions), { sessionId })));
        }
    }
    removePlayer(sessionId) {
        const player = Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
        if (player != null) {
            this.players.delete(player.userId);
        }
    }
    ready(sessionId, ready) {
        const player = this._getPlayer(sessionId);
        if (player != null) {
            player.ready = ready;
        }
    }
    _newBlock(x, y) {
        // Get random data for the block
        const blockData = (0, getRandomBlock_1.getRandomBlock)(x, y);
        const block = (0, Block_1.Block)(blockData, false, this.engine);
        this.blockPositions.set(block.id, { x: blockData.x, y: blockData.y, rotation: blockData.rotation });
        // Create IBlockData for storage in controlledBlocks
        return Object.assign(Object.assign({}, blockData), { id: block.id });
    }
    startGame() {
        // Create a block for each player.
        this.engine.gravity.y = 0;
        const startBlocks = [];
        let x = 75;
        this.players.forEach((p) => {
            const block = this._newBlock(x, 0);
            x += 75;
            this.controlledBlocks.set(p.sessionId, block.id);
            this.playerInputDelta.set(block.id, { x: 0, y: 0 });
            startBlocks.push(block);
        });
        // Create a floor.
        // TODO: create floors for each player, + walls between each player.
        const floor = matter_js_1.Bodies.rectangle(150, 300, 300, 20, {
            isStatic: true,
        });
        matter_js_1.World.add(this.engine.world, floor);
        this.blockPositions.set(floor.id, { x: floor.position.x, y: floor.position.y, rotation: floor.angle });
        console.log('Game start: ', this.controlledBlocks, this.blockPositions);
        matter_js_1.Events.on(this.engine, 'beforeUpdate', this.applyPlayerMovement);
        // Run the engine.
        matter_js_1.Runner.run(this.runner, this.engine);
        return startBlocks;
    }
    _calculateBodyDeltas(event) {
        const updates = [];
        for (const body of this.engine.world.bodies) {
            // remove the body if it is below the floor.
            if (body.position.y > 500) {
                matter_js_1.World.remove(this.engine.world, body);
                continue;
            }
            // saved block position
            const blockPosition = this.blockPositions.get(body.id);
            // calculate changes in stored positions and current body positions.
            const deltaX = body.position.x - blockPosition.x;
            const deltaY = body.position.y - blockPosition.y;
            const deltaAngle = (body.angle - blockPosition.rotation) % (2 * Math.PI);
            // Only update if there is a change.
            const delta = {};
            if (Math.abs(deltaX) > 0.001) {
                delta.x = deltaX;
            }
            if (Math.abs(deltaY) > 0.001) {
                delta.y = deltaY;
            }
            if (Math.abs(deltaAngle) > 0.001) {
                delta.rotation = deltaAngle;
            }
            if (Object.keys(delta).length > 0) {
                delta.id = body.id;
                updates.push(delta);
            }
            // Update stored positions.
            this.blockPositions.set(body.id, {
                x: delta.x ? body.position.x : blockPosition.x,
                y: delta.y ? body.position.y : blockPosition.y,
                rotation: delta.rotation ? body.angle : blockPosition.rotation,
            });
        }
        return updates;
    }
    // Sets a players movement delta
    setPlayerInput(sessionId, inputType) {
        const player = this._getPlayer(sessionId);
        if (player) {
            const blockId = this.controlledBlocks.get(sessionId);
            if (blockId) {
                const inputDelta = this.playerInputDelta.get(blockId);
                switch (inputType) {
                    case 'move-left-start':
                        inputDelta.x = -3;
                        break;
                    case 'move-left-stop':
                        inputDelta.x = 0;
                        break;
                    case 'move-right-start':
                        inputDelta.x = 3;
                        break;
                    case 'move-right-stop':
                        inputDelta.x = 0;
                        break;
                    // Rotation Input
                    case 'rotate-left':
                        matter_js_1.Body.rotate(this.engine.world.bodies.find((b) => b.id === blockId), -Math.PI / 2);
                        break;
                    case 'rotate-right':
                        matter_js_1.Body.rotate(this.engine.world.bodies.find((b) => b.id === blockId), Math.PI / 2);
                        break;
                    default:
                        console.log('Unknown input type: ', inputType);
                        break;
                }
            }
        }
    }
    // Translate bodies in the engine based on player input.
    applyPlayerMovement() {
        for (const [blockId, inputDelta] of this.playerInputDelta) {
            const block = this.engine.world.bodies.find((b) => b.id === blockId);
            if (block) {
                matter_js_1.Body.translate(block, inputDelta);
            }
        }
        // Apply gravity to all blocks that are not being controlled.
        for (const block of this.engine.world.bodies) {
            if (!this.playerInputDelta.has(block.id)) {
                // TODO: Update gravity scalar to be better tuned.
                matter_js_1.Body.applyForce(block, block.position, { x: 0, y: 0.0005 * block.mass });
            }
        }
    }
    _handleCollisions(event) {
        const newBlocksData = [];
        // check if a controlled block is in the collisions:
        for (const pair of event.pairs) {
            for (const [sessionId, blockId] of this.controlledBlocks) {
                if (pair.bodyA.id === blockId || pair.bodyB.id === blockId) {
                    const oldBlock = pair.bodyA.id === blockId ? pair.bodyA : pair.bodyB;
                    const newBlock = this._newBlock(75, 0);
                    this.controlledBlocks.set(sessionId, newBlock.id);
                    newBlocksData.push(newBlock);
                    // Move the player input delta to the new block.
                    this.playerInputDelta.set(newBlock.id, this.playerInputDelta.get(blockId));
                    this.playerInputDelta.delete(blockId);
                }
            }
        }
        return newBlocksData;
    }
}
exports.State = State;
__decorate([
    (0, schema_1.type)({ map: Player_1.Player })
], State.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)('string')
], State.prototype, "roomName", void 0);
__decorate([
    (0, schema_1.type)('string')
], State.prototype, "channelId", void 0);
