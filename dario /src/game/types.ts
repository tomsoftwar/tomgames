export type GameScreenState =
  | 'TITLE_MENU'
  | 'STAGE_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type DarioPowerState = 'small' | 'big' | 'fire';

export type PowerUpType = 'mushroom' | 'fire_flower' | 'star' | 'one_up' | 'feather';

export type BiomeTheme =
  | 'overworld'
  | 'pipes'
  | 'underground'
  | 'sky'
  | 'desert'
  | 'forest'
  | 'ice'
  | 'airship'
  | 'volcano'
  | 'castle';

export type TileType =
  | 0 // Empty
  | 1 // Ground
  | 2 // Brick (breakable when big/fire)
  | 3 // Question block
  | 4 // Used / brown hit block (matches NES screenshot)
  | 5 // Hard stone / stair block
  | 6 // Pipe body
  | 7 // Pipe top
  | 8 // Lava / instant hazard
  | 9 // Spikes (damage)
  | 10 // Bridge / platform pass-through
  | 11 // Ice ground (slippery)
  | 12; // Boss gate / Castle brick

export type QuestionLoot = 'coin' | PowerUpType;

export interface QuestionBlockMeta {
  loot: QuestionLoot;
  hit: boolean;
  bounceY: number;
}

export interface MovingPlatform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  t: number;
  dir: 1 | -1;
  vx: number;
  vy: number;
}

export interface SpringPad {
  x: number;
  y: number;
  compressedTimer: number;
}

export interface FireBar {
  cx: number;
  cy: number;
  length: number;
  angle: number;
  speed: number;
}

export interface CoinEntity {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  bobOffset: number;
}

export interface PowerUpEntity {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  spawnTimer: number;
  collected: boolean;
}

export type EnemyKind =
  | 'goomba'
  | 'koopa'
  | 'piranha'
  | 'bat'
  | 'spiny'
  | 'cannon_bullet'
  | 'lava_pod';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  alive: boolean;
  squashedTimer: number;
  shellMode?: boolean;
  shellMoving?: boolean;
  homeY: number;
  phase: number;
  facing: 1 | -1;
}

export type BossKind =
  | 'king_goomba'
  | 'alpha_piranha'
  | 'armored_beetle'
  | 'thunder_falcon'
  | 'fire_scorpion'
  | 'phantom_warden'
  | 'crystal_yeti'
  | 'cannon_mech'
  | 'magma_dragon'
  | 'supreme_koopa_king';

export interface BossEntity {
  kind: BossKind;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  active: boolean;
  defeated: boolean;
  invulnTimer: number;
  actionTimer: number;
  state: 'idle' | 'charge' | 'jump' | 'shoot' | 'swoop' | 'stunned';
  phaseAngle: number;
  arenaLeft: number;
  arenaRight: number;
  floorY: number;
}

export interface ProjectileEntity {
  id: number;
  fromPlayer: boolean;
  kind: 'fireball' | 'enemy_orb' | 'ice_boulder' | 'cannonball' | 'hammer' | 'feather';
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  bounces: number;
  alive: boolean;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  power: DarioPowerState;
  starTimer: number;
  featherTimer: number;
  invulnTimer: number;
  fireCooldown: number;
  walkFrame: number;
  walkTimer: number;
  dead: boolean;
  deathTimer: number;
  hasWonStage: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  fire: boolean;
  fireJustPressed: boolean;
}

export interface LevelConfig {
  stage: number;
  name: string;
  subtitle: string;
  biome: BiomeTheme;
  skyColor: string;
  skyBottomColor?: string;
  widthTiles: number;
  heightTiles: number;
  tiles: TileType[][];
  questionBlocks: Record<string, QuestionBlockMeta>;
  coins: CoinEntity[];
  enemies: EnemyEntity[];
  movingPlatforms: MovingPlatform[];
  springs: SpringPad[];
  fireBars: FireBar[];
  boss: BossEntity;
  arenaTriggerX: number;
  goalX: number;
  goalY: number;
  timeLimit: number;
  hasPrincess: boolean;
}

export interface HudSnapshot {
  screen: GameScreenState;
  stage: number;
  stageName: string;
  score: number;
  coins: number;
  lives: number;
  nextLifeScore: number;
  timeLeft: number;
  power: DarioPowerState;
  starActive: boolean;
  featherActive: boolean;
  bossActive: boolean;
  bossName: string;
  bossSubtitle: string;
  bossHp: number;
  bossMaxHp: number;
  princessSaved: boolean;
  muted: boolean;
}

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  coins: number;
  stageReached: number;
  savedPrincess: boolean;
  createdAt: string;
}
