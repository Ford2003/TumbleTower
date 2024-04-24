import * as React from 'react';
// import './GameScreen.css';
import {usePlayers} from '../hooks/usePlayers';
import {useAuthenticatedContext} from '../hooks/useAuthenticatedContext';
import {Player} from './Player';
import {Engine, Runner, Render, Bodies, World, Body} from 'matter-js';
import {IBlockData} from '../../../server/src/shared/Constants';
import {Block} from './Block';

export function Game() {
  const canvasRef = React.useRef(null);
  const boxRef = React.useRef(null);
  const [moveLeftPressed, setMoveLeftPressed] = React.useState(false);
  const [moveRightPressed, setMoveRightPressed] = React.useState(false);
  const players = usePlayers();
  const authContext = useAuthenticatedContext();
  // On page load set up client Mock Engine and renderer.
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
    const floor = Bodies.rectangle(150, 300, 300, 20, {
      isStatic: true,
      render: {
        fillStyle: 'yellow',
      },
    });
    World.add(mockEngine.world, floor);
    const runner = Runner.create();
    Runner.run(runner, mockEngine);
    // Set up listener for block creation.
    authContext.room.onMessage('block-created', (data: {block: IBlockData}) => {
      // Create identical block in same location as static.
      const newBlock = Block(data.block, true, mockEngine, data.block.id);
      Render.lookAt(render, [newBlock, floor], {x: 50, y: 50}, true);
      console.log(`Client: Block Created, id ${data.block.id}, id: ${newBlock.id}`);
    });
    // Set up listener for block updates.
    authContext.room.onMessage(
      'block-updates',
      (data: Array<{id: number; x?: number; y?: number; rotation?: number}>) => {
        for (const update of data) {
          const body = mockEngine.world.bodies.find((b) => b.id === update.id);
          if (body) {
            Body.translate(body, {x: update.x || 0, y: update.y || 0});
            Body.rotate(body, update.rotation || 0);
          }
        }
      }
    );
    // Set up input listeners for player movement.
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

  const rotateBlock = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    console.log(event.button, event.type);
    if (event.button === 0) {
      authContext.room.send('player-input', 'rotate-left');
    }
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
