import {Schema, type} from '@colyseus/schema';

export type TBlockOptions = Pick<BlockObject, 'blockId' | 'blockType' | 'x' | 'y' | 'rotation' | 'colour'>;

export class BlockObject extends Schema {
  @type('string')
  public blockId: string;

  @type('string')
  public blockType: string;

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public rotation: number = 0;

  @type('string')
  public colour: string;

  // Init
  constructor({blockId, blockType, x, y, rotation, colour}: TBlockOptions) {
    super();
    this.blockId = blockId;
    this.blockType = blockType;
    this.x = x;
    this.y = y;
    this.rotation = rotation
    this.colour = colour;
  }
}