import {Schema, MapSchema, type} from '@colyseus/schema';
import {TPlayerOptions, Player} from './Player';
import {TBlockOptions, BlockObject} from "./Block";
import {Engine, Runner, IEvent, Bodies, World, Body, IEventCollision} from 'matter-js';
import {Block} from '../../../client/src/components/Block';

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

  engine: Engine = Engine.create({positionIterations: 12, velocityIterations: 8, constraintIterations: 4});
  runner: Runner = Runner.create({delta: 1000 / 240}); // Run the engine at 240Hz

  // Map of controlled blocks key = sessionId, value = Controlled Block Id
  controlledBlocks: Map<string, string> = new Map();

  // Maps blocks to IDs
  @type({map: BlockObject})
  blockPositions = new MapSchema<BlockObject>();

  // Store player input to add onto block movement. key = blockId, value = block movement xy delta
  playerInputDelta: Map<string, {x: number; y: number}> = new Map();

  // Store where each players new block should be spawned. key = sessionId, value = x position.
  playerBlockStarts: Map<string, number> = new Map();

  // Init
  constructor(attributes: IState) {
    super();
    this.roomName = attributes.roomName;
    this.channelId = attributes.channelId;
    this.updateBodyPositions = this.updateBodyPositions.bind(this);
    this.applyPlayerMovementAndGravity = this.applyPlayerMovementAndGravity.bind(this);
    this.handleCollisions = this.handleCollisions.bind(this);
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

  private _getRandomBlock(x: number, y: number): TBlockOptions {
    // Get random block type
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const typeIdx = Math.floor(Math.random() * types.length);
    const blockType = types[typeIdx];
    // Get random block colour
    const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
    const colourIdx = Math.floor(Math.random() * colours.length);
    const colour = colours[colourIdx];
    // Get random block rotation
    const rotations = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const rotationIdx = Math.floor(Math.random() * rotations.length);
    const rotation = rotations[rotationIdx];

    const blockId = "0";
    return {blockId, blockType, x, y, rotation, colour};
  }

  private _newBlock(x: number, y: number): TBlockOptions {
    // Get random data for the block
    const blockData = this._getRandomBlock(x, y);
    const block = Block({...blockData, type: blockData.blockType}, false, this.engine!);
    this.blockPositions.set(String(block.id), new BlockObject({...blockData, blockId: String(block.id)}));
    // Create IBlockData for storage in controlledBlocks
    return {...blockData, blockId: String(block.id)};
  }

  startGame() {
    // Create a block for each player.
    this.engine.gravity.y = 0.2;
    const startBlocks: TBlockOptions[] = [];
    let x = 75;
    // Start with left most wall
    const wall = Bodies.rectangle(x - 100, 200, 10, 200, {
      isStatic: true,
      render: {
        fillStyle: 'red',
      }
    });
    World.add(this.engine.world, wall);
    this.players.forEach((p) => {
      const block = this._newBlock(x, 0);
      this.controlledBlocks.set(p.sessionId, block.blockId);
      this.playerInputDelta.set(block.blockId, {x: 0, y: 0});
      startBlocks.push(block);
      this.playerBlockStarts.set(p.sessionId, x);
      // Create a floor.
      const floor = Bodies.rectangle(x, 300, 100, 20, {
        isStatic: true,
        render: {
          fillStyle: 'yellow',
        }
      });
      // 100 width, 75 + 50 + 50 + 50 + 50 = 225 so add 150 to x. 100 gap between floors (50 to wall 50 to floor).
      World.add(this.engine.world, floor);
      // Add small walls between each player.
      const wall = Bodies.rectangle(x + 100, 200, 10, 200, {
        isStatic: true,
      });
      World.add(this.engine.world, wall);
      x += 200;
    });
    console.log('Game start: ', this.controlledBlocks, this.blockPositions);
    // Run the engine.
    Runner.run(this.runner, this.engine);
    return startBlocks;
  }

  updateBodyPositions(_event: IEvent<Engine | null>) {
    for (const body of this.engine.world.bodies) {
      // remove the body if it is below the floor.
      if (body.position.y > 500) {
        World.remove(this.engine.world, body);
        this.blockPositions.delete(String(body.id));
        continue;
      }
      // saved block position
      const blockPosition = this.blockPositions.get(String(body.id));
      if (blockPosition) {
        blockPosition.x = body.position.x;
        blockPosition.y = body.position.y;
        blockPosition.rotation = body.angle;
      }
    }
  }

  // Sets a players movement delta
  setPlayerInput(sessionId: string, inputType: string) {
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
          Body.rotate(this.engine.world.bodies.find((b) => String(b.id) === blockId)!, -Math.PI / 2);
          break;
        case 'rotate-right':
          Body.rotate(this.engine.world.bodies.find((b) => String(b.id) === blockId)!, Math.PI / 2);
          break;
        default:
          console.log('Unknown input type: ', inputType);
          break;
      }
    }
  }

  // Translate bodies in the engine based on player input.
  applyPlayerMovementAndGravity() {
    for (const block of this.engine.world.bodies) {
      // Check if the block is controlled.
      const inputDelta = this.playerInputDelta.get(String(block.id));
      if (inputDelta) {
        Body.translate(block, inputDelta);
        // Set velocity back to 0,1 to counteract gravity force.
        Body.setVelocity(block, {x: 0, y: 1});
        //Body.applyForce(block, block.position, {x: 0, y: -this.engine.gravity.y});
      } else {
        // TODO: Update gravity scalar to be better tuned.
        // TODO: Reinvestigate gravity application as it may be causing weird forcing bahviour. Perhaps turn on gravity in the engine, but apply an opposing force on controlled blocks to negate the gravity.
        //Body.applyForce(block, block.position, {x: 0, y: 0.0004 * block.mass});
      }
    }
  }

  handleCollisions(event: IEventCollision<Engine>) {
    // check if a controlled block is in the collisions:
    for (const pair of event.pairs) {
      for (const [sessionId, blockId] of this.controlledBlocks) {
        if (String(pair.bodyA.id) === blockId || String(pair.bodyB.id) === blockId) {
          const newBlock = this._newBlock(this.playerBlockStarts.get(sessionId)!, 0);
          this.controlledBlocks.set(sessionId, newBlock.blockId);
          // Move the player input delta to the new block.
          this.playerInputDelta.set(newBlock.blockId, this.playerInputDelta.get(blockId)!);
          this.playerInputDelta.delete(blockId);
        }
      }
    }
  }
}
