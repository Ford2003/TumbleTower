
import {Schema, MapSchema, type} from '@colyseus/schema';
import {TPlayerOptions, Player} from './Player';
import {Engine, Runner, IEvent, Bodies, World, Events, Body, IEventCollision} from 'matter-js';
import {Block} from '../../../client/src/components/Block';
import {getRandomBlock} from '../../../client/src/utils/getRandomBlock';
import {IBlockData} from '../shared/Constants';

export interface IState {
  roomName: string;
  channelId: string;
}

export class State extends Schema {
  @type({map: Player})
  players = new MapSchema<Player>();

  @type('string')
  public roomName: string;

  @type('string')
  public channelId: string;

  engine: Engine = Engine.create();
  runner: Runner = Runner.create();

  // Map of controlled blocks key = sessionId, value = Controlled Block Id
  controlledBlocks: Map<string, number> = new Map();
  blockPositions: Map<number, {x: number; y: number; rotation: number}> = new Map();

  // Store player input to add onto block movement. key = blockId, value = block movement xy delta
  playerInputDelta: Map<number, {x: number; y: number}> = new Map();

  // Store where each players new block should be spawned. key = sessionId, value = x position.
  playerBlockStarts: Map<string, number> = new Map();

  // Init
  constructor(attributes: IState) {
    super();
    this.roomName = attributes.roomName;
    this.channelId = attributes.channelId;
    this._calculateBodyDeltas = this._calculateBodyDeltas.bind(this);
    this.applyPlayerMovement = this.applyPlayerMovement.bind(this);
    this._handleCollisions = this._handleCollisions.bind(this);
  }

  private _getPlayer(sessionId: string): Player | undefined {
    return Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
  }

  createPlayer(sessionId: string, playerOptions: TPlayerOptions) {
    const existingPlayer = Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
    if (existingPlayer == null) {
      this.players.set(playerOptions.userId, new Player({...playerOptions, sessionId}));
    }
  }

  removePlayer(sessionId: string) {
    const player = Array.from(this.players.values()).find((p) => p.sessionId === sessionId);
    if (player != null) {
      this.players.delete(player.userId);
    }
  }

  ready(sessionId: string, ready: boolean) {
    const player = this._getPlayer(sessionId);
    if (player != null) {
      player.ready = ready;
    }
  }

  _newBlock(x: number, y: number): IBlockData {
    // Get random data for the block
    const blockData = getRandomBlock(x, y);
    const block = Block(blockData, false, this.engine!);
    this.blockPositions.set(block.id, {x: blockData.x, y: blockData.y, rotation: blockData.rotation});
    // Create IBlockData for storage in controlledBlocks
    return {...blockData, id: block.id};
  }

  runEngine(fps: number = 60) {
    const targetDelta = 1000 / fps; // Calculate the target time step
    let previousTime = 0;

    setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - previousTime;
      previousTime = currentTime;

      Runner.tick(this.runner, this.engine, deltaTime);
    }, targetDelta); // Use the target delta for the interval
  }

  startGame() {
    // Create a block for each player.
    this.engine.gravity.y = 0;
    const startBlocks: IBlockData[] = [];
    let x = 75;
    // Start with left most wall
    const wall = Bodies.rectangle(x - 100, 200, 10, 200, {
      isStatic: true,
    });
    World.add(this.engine.world, wall);
    this.blockPositions.set(wall.id, {x: wall.position.x, y: wall.position.y, rotation: wall.angle});
    this.players.forEach((p) => {
      const block = this._newBlock(x, 0);
      this.controlledBlocks.set(p.sessionId, block.id);
      this.playerInputDelta.set(block.id, {x: 0, y: 0});
      startBlocks.push(block);
      this.playerBlockStarts.set(p.sessionId, x);
      // Create a floor.
      const floor = Bodies.rectangle(x, 300, 100, 20, {
        isStatic: true,
      });
      // 100 width, 75 + 50 + 50 + 50 + 50 = 225 so add 150 to x. 100 gap between floors (50 to wall 50 to floor).
      World.add(this.engine.world, floor);
      this.blockPositions.set(floor.id, {x: floor.position.x, y: floor.position.y, rotation: floor.angle});
      // Add small walls between each player.
      const wall = Bodies.rectangle(x + 100, 200, 10, 200, {
        isStatic: true,
      });
      World.add(this.engine.world, wall);
      this.blockPositions.set(wall.id, {x: wall.position.x, y: wall.position.y, rotation: wall.angle});
      x += 200;
    });
    console.log('Game start: ', this.controlledBlocks, this.blockPositions);
    Events.on(this.engine, 'beforeUpdate', this.applyPlayerMovement);
    // Run the engine.
    this.runEngine(Number(process.env.SERVER_FPS || '60'));
    return startBlocks;
  }

  _calculateBodyDeltas(_event: IEvent<Engine | null>) {
    const updates: Array<{id?: number; x?: number; y?: number; rotation?: number}> = [];
    for (const body of this.engine.world.bodies) {
      // remove the body if it is below the floor.
      if (body.position.y > 500) {
        World.remove(this.engine.world, body);
        continue;
      }
      // saved block position
      const blockPosition = this.blockPositions.get(body.id)!;
      // calculate changes in stored positions and current body positions.
      const deltaX = body.position.x - blockPosition.x;
      const deltaY = body.position.y - blockPosition.y;
      const deltaAngle = (body.angle - blockPosition.rotation) % (2 * Math.PI);
      // Only update if there is a change.
      const delta: {id?: number; x?: number; y?: number; rotation?: number} = {};
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
  setPlayerInput(sessionId: string, inputType: string) {
    const player = this._getPlayer(sessionId);
    if (player) {
      const blockId = this.controlledBlocks.get(sessionId);
      if (blockId) {
        const inputDelta = this.playerInputDelta.get(blockId)!;
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
            Body.rotate(this.engine.world.bodies.find((b) => b.id === blockId)!, -Math.PI / 2);
            break;
          case 'rotate-right':
            Body.rotate(this.engine.world.bodies.find((b) => b.id === blockId)!, Math.PI / 2);
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
        Body.translate(block, inputDelta);
      }
    }
    // Apply gravity to all blocks that are not being controlled.
    for (const block of this.engine.world.bodies) {
      if (!this.playerInputDelta.has(block.id)) {
        // TODO: Update gravity scalar to be better tuned.
        Body.applyForce(block, block.position, {x: 0, y: 0.0004 * block.mass});
      }
    }
  }

  _handleCollisions(event: IEventCollision<Engine>) {
    const newBlocksData: IBlockData[] = [];
    // check if a controlled block is in the collisions:
    for (const pair of event.pairs) {
      for (const [sessionId, blockId] of this.controlledBlocks) {
        if (pair.bodyA.id === blockId || pair.bodyB.id === blockId) {
          const newBlock = this._newBlock(this.playerBlockStarts.get(sessionId)!, 0);
          this.controlledBlocks.set(sessionId, newBlock.id);
          newBlocksData.push(newBlock);
          // Move the player input delta to the new block.
          this.playerInputDelta.set(newBlock.id, this.playerInputDelta.get(blockId)!);
          this.playerInputDelta.delete(blockId);
        }
      }
    }
    return newBlocksData;
  }
}
