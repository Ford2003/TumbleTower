import * as React from 'react';
import './Player.css';
import {TPlayerOptions} from '../../../server/src/entities/Player';
import {Block} from './Block';
import {Engine, Body} from 'matter-js';
import {getRandomBlock} from '../utils/getRandomBlock';

interface PlayerProps {
  name: string;
}

export function Player({name}: PlayerProps) {
  const [activeBlock, setActiveBlock] = React.useState<Body>();
  // Block({type: 'I', x: 0, y: 0, rotation: 0, colour: 'blue', engine});
  /*
  const platform = Bodies.fromVertices(
    0,
    0,
    [
      [
        {x: 0, y: 0},
        {x: 30, y: 10},
        {x: 800, y: 20},
        {x: 0, y: 20},
      ],
    ],
    {
      position: {x: 0, y: 0},
      isStatic: true,
    }
  );
  World.add(engine.world, platform);


  function newBlock() {
    let blockBody = Block(getRandomBlock(100, 100, engine));
    console.log(`Body created, id: ${blockBody.id}`);
    setActiveBlock(blockBody);
  }
  // When the game loads create a new block.
  React.useEffect(() => {
    newBlock();
  }, []);
  if (activeBlock) {
    console.log(`Active Block ID: ${activeBlock.id}`);
  } else {
    console.log('No active block');
  }
  console.log(name);
  /*
  // Handle player movement and block creation, when a new block is created.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle block movement with keyboard press
      if (!activeBlock) return;
      switch (e.key) {
        case 'a' || 'ArrowLeft':
          Body.translate(activeBlock, {x: -10, y: 0});
          break;
        case 'd' || 'ArrowRight':
          Body.translate(activeBlock, {x: 10, y: 0});
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeBlock]);


  // Add collision detection to the player.
  React.useEffect(() => {
    const handleCollision = (event: IEventCollision<any>) => {
      const pairs = event.pairs;
      pairs.forEach((pair) => {
        if (pair.bodyA === activeBlock || pair.bodyB === activeBlock) {
          newBlock();
        }
      });
    };
    Events.on(engine, 'collisionStart', handleCollision);
    return () => {
      Events.off(engine, 'collisionStart', handleCollision);
    };
  });
  */

  return (
    <div className="player__container">
      <div className="player__name">{name}</div>
    </div>
  );
}
