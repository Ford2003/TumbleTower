import {Schema, type} from '@colyseus/schema';

export type TPlayerOptions = Pick<Player, 'sessionId' | 'userId' | 'name' | 'avatarUri' | 'ready' | 'x' | 'y'>;

export class Player extends Schema {
  @type('string')
  public sessionId: string;

  @type('string')
  public userId: string;

  @type('string')
  public avatarUri: string;

  @type('string')
  public name: string;

  @type('boolean')
  public ready: boolean = false;

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  // Init
  constructor({name, userId, avatarUri, sessionId}: TPlayerOptions) {
    super();
    this.userId = userId;
    this.avatarUri = avatarUri;
    this.name = name;
    this.sessionId = sessionId;
  }
}
