import * as React from 'react';
// import './GameScreen.css';
import {usePlayers} from '../hooks/usePlayers';
import {useAuthenticatedContext} from '../hooks/useAuthenticatedContext';
import {Engine, Runner, Render, Bodies, World, Body} from 'matter-js';
import {Block} from './Block';
import {getStateCallbacks} from 'colyseus.js';

export function Game() {
  // React References
  const canvasRef = React.useRef(null);
  const boxRef = React.useRef(null);
  // React States
  const [moveLeftPressed, setMoveLeftPressed] = React.useState(false);
  const [moveRightPressed, setMoveRightPressed] = React.useState(false);
  // React Contexts.
  const authContext = useAuthenticatedContext();
  const players = usePlayers();

  // On page load set up client: Mock Engine + renderer + floors + listeners.
  React.useEffect(() => {
    const mockEngine = Engine.create();
    mockEngine.gravity.y = 0;
    const render = Render.create({
      element: boxRef.current!,
      canvas: canvasRef.current!,
      engine: mockEngine,
      options: {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
        wireframes: false,
        background: 'rgb(129,250,0)',
      },
    });
    Render.run(render);
    let x = 75;
    const floors: Body[] = [];
    // Start with leftmost wall.
    const wall = Bodies.rectangle(x - 100, 200, 10, 200, {
      isStatic: true,
      render: {
        fillStyle: 'red',
      }
    });
    World.add(mockEngine.world, wall);
    // For each player create a floor and wall on the right the player between the walls.
    for (const _ in players) {
      const floor = Bodies.rectangle(x, 300, 100, 20, {
        isStatic: true,
        render: {
          fillStyle: 'yellow',
        }
      });
      floors.push(floor);
      World.add(mockEngine.world, floor);
      // Add small walls between each player.
      const wall = Bodies.rectangle(x + 100, 200, 10, 200, {
        isStatic: true,
        render: {
          fillStyle: 'red',
        }
      });
      World.add(mockEngine.world, wall);
      x += 200;
    }

    const runner = Runner.create();
    Runner.run(runner, mockEngine);

    // TODO: Add cleanup function to remove listeners.
    // Set up state listeners and callbacks.
    const stateCallbacks = getStateCallbacks(authContext.room);
    stateCallbacks(authContext.room.state).blockPositions.onAdd((block, blockId) => {
      console.log(`Block ${blockId} added with ID = ${Number(block.blockId)}`);
      const newBlock = Block({type: block.blockType, x: block.x, y: block.y, colour: block.colour, rotation: block.rotation}, true, mockEngine, Number(block.blockId));
      Render.lookAt(render, [newBlock, ...floors], {x: 50, y: 50}, true);

      stateCallbacks(block).onChange(() => {
        const body = mockEngine.world.bodies.find((b) => String(b.id) === block.blockId);
        if (body) {
          Body.translate(body, {x: block.x - body.position.x, y: block.y - body.position.y});
          Body.rotate(body, (block.rotation - body.angle) % (2 * Math.PI));
        } else {
          console.log(`Block ${blockId} not found`);
        }
      });
    });

    stateCallbacks(authContext.room.state).blockPositions.onRemove((block, blockId) => {
      console.log(`Block ${blockId} removed`);
      const body = mockEngine.world.bodies.find((b) => String(b.id) === blockId);
      if (body) {
        World.remove(mockEngine.world, body);
      }
    });

    // Set up input listeners for player movement. Send a single event to the server for movement-start and
    // movement end.
    document.addEventListener('keydown', (event) => {
      if ((event.key === 'ArrowLeft' || event.key === 'a') && !moveLeftPressed) {
        setMoveLeftPressed(true);
        authContext.room.send('player-input', 'move-left-start');
      }
      if ((event.key === 'ArrowRight' || event.key === 'd') && !moveRightPressed) {
        setMoveRightPressed(true);
        authContext.room.send('player-input', 'move-right-start');
      }
    });
    document.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        setMoveLeftPressed(false);
        authContext.room.send('player-input', 'move-left-stop');
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        setMoveRightPressed(false);
        authContext.room.send('player-input', 'move-right-stop');
      }
    });
  }, []);

  // Click event callback for both left and right click to rotate the block.
  const rotateBlock = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    // Left click rotates left
    if (event.button === 0) {
      authContext.room.send('player-input', 'rotate-left');
    }
    // Right click rotates right
    if (event.button === 2) {
      authContext.room.send('player-input', 'rotate-right');
    }
  };
  return (
    <div className="GameScreen" onClick={rotateBlock} onContextMenu={rotateBlock}>
      <div ref={boxRef} style={{width: '100%', height: '100%'}}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
