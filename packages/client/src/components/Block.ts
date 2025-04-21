import {Engine, Bodies, Body, Composite, Common} from 'matter-js';
import * as Verts from '../utils/blockVerts';
import * as decomp from '../decomp';
Common.setDecomp(decomp);

interface IBlock {
  type: string;
  x: number;
  y: number;
  rotation: number;
  colour: string;
}

export function Block({type, x, y, rotation, colour}: IBlock, isStatic: boolean, engine: Engine, id?: number) {
  // set the vertices based on the type of block
  let vertices: Array<{x: number; y: number}>;
  switch (type) {
    case 'T':
      vertices = Verts.T;
      break;
    case 'I':
      vertices = Verts.I;
      break;
    case 'L':
      vertices = Verts.L;
      break;
    case 'J':
      vertices = Verts.J;
      break;
    case 'S':
      vertices = Verts.S;
      break;
    case 'Z':
      vertices = Verts.Z;
      break;
    case 'O':
      vertices = Verts.O;
      break;
    default:
      vertices = [];
      console.log('No vertices found for block type: ', type);
  }
  if (id === undefined) {
    id = Common.nextId();
  }
  const blockBody = Bodies.fromVertices(
    x,
    y,
    [vertices],
    {
      isStatic: isStatic,
      frictionAir: 0,
      id: id,
      friction: 0.2,
      restitution: 0,
      render: {
        fillStyle: colour,
      },
    },
    true,
    0.01,
    1,
    0.01
  );
  // Body.scale(blockBody, 2, 2);
  Body.rotate(blockBody, rotation);
  Body.setVelocity(blockBody, {x: 0, y: 1});
  console.log(`Block Body created | id: ${blockBody.id}, position: {${blockBody.position.x}, ${blockBody.position.y}}, rotation: ${rotation}`);
  Composite.add(engine.world, blockBody);

  return blockBody;
}
