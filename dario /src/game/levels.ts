import type {
  BiomeTheme,
  BossEntity,
  BossKind,
  CoinEntity,
  EnemyEntity,
  EnemyKind,
  FireBar,
  LevelConfig,
  MovingPlatform,
  QuestionBlockMeta,
  QuestionLoot,
  SpringPad,
  TileType,
} from './types';
import { TILE } from './sprites';

interface StageTemplate {
  stage: number;
  name: string;
  subtitle: string;
  biome: BiomeTheme;
  skyColor: string;
  lengthTiles: number;
  timeLimit: number;
  bossKind: BossKind;
  bossName: string;
  bossSubtitle: string;
  bossHp: number;
}

const STAGE_TEMPLATES: StageTemplate[] = [
  {
    stage: 1,
    name: 'Planície do Reino',
    subtitle: 'Os arredores do Castelo',
    biome: 'overworld',
    skyColor: '#5C94FC',
    lengthTiles: 130,
    timeLimit: 240,
    bossKind: 'king_goomba',
    bossName: 'Mestre Cogumelo',
    bossSubtitle: 'Guardião da Planície',
    bossHp: 3,
  },
  {
    stage: 2,
    name: 'Vale dos Canos',
    subtitle: 'Labirinto verde esmeralda',
    biome: 'pipes',
    skyColor: '#5C94FC',
    lengthTiles: 140,
    timeLimit: 250,
    bossKind: 'alpha_piranha',
    bossName: 'Planta Alfa',
    bossSubtitle: 'Rainha dos Canos',
    bossHp: 4,
  },
  {
    stage: 3,
    name: 'Caverna Subterrânea',
    subtitle: 'Galerias de pedra azul',
    biome: 'underground',
    skyColor: '#000000',
    lengthTiles: 145,
    timeLimit: 260,
    bossKind: 'armored_beetle',
    bossName: 'Besouro Blindado',
    bossSubtitle: 'Colosso das Profundezas',
    bossHp: 4,
  },
  {
    stage: 4,
    name: 'Pontes das Nuvens',
    subtitle: 'Acima do reino celestial',
    biome: 'sky',
    skyColor: '#6888FF',
    lengthTiles: 150,
    timeLimit: 260,
    bossKind: 'thunder_falcon',
    bossName: 'Falcão Trovão',
    bossSubtitle: 'Senhor dos Ventos',
    bossHp: 5,
  },
  {
    stage: 5,
    name: 'Deserto Escaldante',
    subtitle: 'Dunas e ruínas douradas',
    biome: 'desert',
    skyColor: '#F09848',
    lengthTiles: 155,
    timeLimit: 270,
    bossKind: 'fire_scorpion',
    bossName: 'Escorpião de Fogo',
    bossSubtitle: 'Terror das Areias',
    bossHp: 5,
  },
  {
    stage: 6,
    name: 'Floresta Sombria',
    subtitle: 'Bosque encantado da névoa',
    biome: 'forest',
    skyColor: '#181848',
    lengthTiles: 160,
    timeLimit: 280,
    bossKind: 'phantom_warden',
    bossName: 'Fantasma Guardião',
    bossSubtitle: 'Espectro da Floresta',
    bossHp: 6,
  },
  {
    stage: 7,
    name: 'Geleira Congelada',
    subtitle: 'Picos escorregadios do norte',
    biome: 'ice',
    skyColor: '#88D0F8',
    lengthTiles: 165,
    timeLimit: 290,
    bossKind: 'crystal_yeti',
    bossName: 'Yeti de Cristal',
    bossSubtitle: 'Fera da Nevasca',
    bossHp: 6,
  },
  {
    stage: 8,
    name: 'Fortaleza Aérea',
    subtitle: 'Frota blindada do império',
    biome: 'airship',
    skyColor: '#281850',
    lengthTiles: 170,
    timeLimit: 300,
    bossKind: 'cannon_mech',
    bossName: 'Capitão Canhão',
    bossSubtitle: 'Comandante da Frota',
    bossHp: 7,
  },
  {
    stage: 9,
    name: 'Abismo de Lava',
    subtitle: 'Cratera ardente do vulcão',
    biome: 'volcano',
    skyColor: '#200808',
    lengthTiles: 175,
    timeLimit: 310,
    bossKind: 'magma_dragon',
    bossName: 'Dragão Magma',
    bossSubtitle: 'Guardião do Vulcão',
    bossHp: 8,
  },
  {
    stage: 10,
    name: 'Castelo do Rei Sombrio',
    subtitle: 'Salve a Princesa Clarice!',
    biome: 'castle',
    skyColor: '#08080C',
    lengthTiles: 185,
    timeLimit: 340,
    bossKind: 'supreme_koopa_king',
    bossName: 'Rei Casco Supremo',
    bossSubtitle: 'O Grande Vilão Final',
    bossHp: 10,
  },
];

export function getStagePreviewList() {
  return STAGE_TEMPLATES.map((t) => ({
    stage: t.stage,
    name: t.name,
    subtitle: t.subtitle,
    bossName: t.bossName,
    bossSubtitle: t.bossSubtitle,
    skyColor: t.skyColor,
    biome: t.biome,
  }));
}

export function buildLevel(stageNum: number): LevelConfig {
  const tpl = STAGE_TEMPLATES[Math.max(0, Math.min(STAGE_TEMPLATES.length - 1, stageNum - 1))];
  const H = 15;
  const W = tpl.lengthTiles;
  const arenaStart = W - 32;
  const arenaEnd = W - 8;
  const groundTile: TileType = tpl.biome === 'ice' ? 11 : tpl.biome === 'castle' ? 12 : 1;

  const tiles: TileType[][] = Array.from({ length: H }, () => Array<TileType>(W).fill(0));
  const questionBlocks: Record<string, QuestionBlockMeta> = {};
  const coins: CoinEntity[] = [];
  const enemies: EnemyEntity[] = [];
  const movingPlatforms: MovingPlatform[] = [];
  const springs: SpringPad[] = [];
  const fireBars: FireBar[] = [];

  let nextId = 1;

  const setTile = (tx: number, ty: number, type: TileType) => {
    if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
      tiles[ty][tx] = type;
    }
  };

  const addQuestion = (tx: number, ty: number, loot: QuestionLoot) => {
    setTile(tx, ty, 3);
    questionBlocks[`${tx},${ty}`] = { loot, hit: false, bounceY: 0 };
  };

  const addPipe = (tx: number, height: number, withPiranha = false) => {
    const topY = 13 - height;
    setTile(tx, topY, 7);
    setTile(tx + 1, topY, 7);
    for (let y = topY + 1; y < 13; y++) {
      setTile(tx, y, 6);
      setTile(tx + 1, y, 6);
    }
    if (withPiranha) {
      enemies.push({
        id: nextId++,
        kind: 'piranha',
        x: tx * TILE + 8,
        y: (topY - 1) * TILE,
        vx: 0,
        vy: 0,
        w: 16,
        h: 20,
        alive: true,
        squashedTimer: 0,
        homeY: (topY - 1) * TILE,
        phase: (tx * 0.7) % (Math.PI * 2),
        facing: -1,
      });
    }
  };

  const addCoin = (tx: number, ty: number) => {
    coins.push({
      id: nextId++,
      x: tx * TILE + 2,
      y: ty * TILE + 1,
      collected: false,
      bobOffset: tx * 5,
    });
  };

  const addEnemy = (kind: EnemyKind, tx: number, ty: number) => {
    const dir = -1;
    const speed =
      kind === 'goomba'
        ? 36 + tpl.stage * 2.5
        : kind === 'koopa'
        ? 40 + tpl.stage * 2.5
        : kind === 'spiny'
        ? 44 + tpl.stage * 2
        : kind === 'bat'
        ? 48 + tpl.stage * 2
        : kind === 'cannon_bullet'
        ? 78 + tpl.stage * 3
        : 0;
    enemies.push({
      id: nextId++,
      kind,
      x: tx * TILE,
      y: ty * TILE - (kind === 'koopa' ? 4 : 0),
      vx: dir * speed,
      vy: 0,
      w: 16,
      h: kind === 'koopa' ? 20 : 16,
      alive: true,
      squashedTimer: 0,
      shellMode: false,
      shellMoving: false,
      homeY: ty * TILE,
      phase: tx * 0.9,
      facing: -1,
    });
  };

  // Base floor everywhere first
  for (let x = 0; x < W; x++) {
    setTile(x, 13, groundTile);
    setTile(x, 14, groundTile);
  }

  // Underground / Castle ceiling
  if (tpl.biome === 'underground' || tpl.biome === 'castle') {
    for (let x = 2; x < arenaStart - 2; x++) {
      if (x % 17 !== 0 && x % 17 !== 1) {
        setTile(x, 0, tpl.biome === 'castle' ? 12 : 2);
      }
    }
  }

  // Deterministic pseudo-random helper per stage
  const seed = (n: number) => {
    const v = Math.sin(tpl.stage * 97.13 + n * 41.7) * 10000;
    return v - Math.floor(v);
  };

  // Opening iconic formation (like user's NES screenshot!)
  if (tpl.stage === 1) {
    addQuestion(11, 9, 'mushroom');
    setTile(16, 9, 2);
    addQuestion(17, 9, 'coin');
    setTile(18, 9, 2);
    addQuestion(19, 9, 'fire_flower');
    setTile(20, 9, 2);
    addQuestion(18, 5, 'one_up');
    addCoin(17, 7);
    addCoin(18, 7);
    addCoin(19, 7);
    addEnemy('goomba', 15, 12);
    addEnemy('goomba', 23, 12);
  } else {
    // Stage 2..10 quick warm-up power-up
    addQuestion(10, 9, 'mushroom');
    setTile(11, 9, 2);
    addQuestion(12, 9, tpl.stage % 2 === 0 ? 'fire_flower' : 'feather');
    setTile(13, 9, 2);
    addCoin(11, 7);
    addCoin(12, 7);
  }

  // Procedural + structured obstacle chunks from x=26 to arenaStart-8
  let cursor = 26;
  let chunkIdx = 0;
  const maxCursor = arenaStart - 10;

  while (cursor < maxCursor) {
    chunkIdx++;
    const r = seed(chunkIdx);

    // Gap / Pit frequency & width scales with stage
    const gapChance = Math.min(0.42, 0.16 + tpl.stage * 0.028);
    if (r < gapChance && cursor < maxCursor - 8) {
      const gapWidth = tpl.stage <= 2 ? 2 : tpl.stage <= 5 ? 3 : r < 0.15 ? 4 : 3;
      const hazardTile: TileType =
        tpl.biome === 'volcano' || tpl.biome === 'castle' ? 8 : 0;

      for (let gx = cursor; gx < cursor + gapWidth; gx++) {
        setTile(gx, 13, hazardTile);
        setTile(gx, 14, hazardTile);
      }

      // Coin arc over pit
      for (let gx = 0; gx < gapWidth; gx++) {
        addCoin(cursor + gx, 9);
      }

      // Add moving platform over wider gaps in later stages
      if (gapWidth >= 4 || tpl.biome === 'sky' || tpl.stage >= 6) {
        movingPlatforms.push({
          id: nextId++,
          x: cursor * TILE,
          y: 10 * TILE + 8,
          w: 32,
          h: 8,
          startX: (cursor - 1) * TILE,
          startY: 10 * TILE + 8,
          endX: (cursor + gapWidth - 1) * TILE,
          endY: 10 * TILE + 8,
          speed: 0.45 + tpl.stage * 0.04,
          t: 0,
          dir: 1,
          vx: 0,
          vy: 0,
        });
      } else if (tpl.biome === 'volcano' || tpl.biome === 'castle') {
        enemies.push({
          id: nextId++,
          kind: 'lava_pod',
          x: (cursor + 1) * TILE,
          y: 13 * TILE,
          vx: 0,
          vy: -240,
          w: 14,
          h: 14,
          alive: true,
          squashedTimer: 0,
          homeY: 14 * TILE,
          phase: chunkIdx,
          facing: -1,
        });
      }

      cursor += gapWidth + 4;
      continue;
    }

    // Pipe obstacle
    if (r < gapChance + 0.22) {
      const pipeH = r < gapChance + 0.1 ? 2 : 3;
      const hasPiranha = tpl.stage >= 2 && chunkIdx % 2 === 0;
      addPipe(cursor, pipeH, hasPiranha);
      if (tpl.stage >= 3 && chunkIdx % 3 === 0) {
        addCoin(cursor, 12 - pipeH - 1);
        addCoin(cursor + 1, 12 - pipeH - 1);
      }
      cursor += 7;
      continue;
    }

    // Block row with power-up / coins / enemies
    if (r < gapChance + 0.5) {
      const rowLen = 4 + Math.floor(seed(chunkIdx + 50) * 3);
      for (let i = 0; i < rowLen; i++) {
        if (i === 1) {
          const loot: QuestionLoot =
            chunkIdx % 7 === 0
              ? 'star'
              : chunkIdx % 5 === 0
              ? 'fire_flower'
              : chunkIdx % 9 === 0
              ? 'one_up'
              : chunkIdx % 4 === 0
              ? 'feather'
              : chunkIdx % 3 === 0
              ? 'mushroom'
              : 'coin';
          addQuestion(cursor + i, 9, loot);
        } else if (i === rowLen - 2) {
          addQuestion(cursor + i, 9, 'coin');
        } else {
          setTile(cursor + i, 9, 2);
        }
        if (i % 2 === 0) {
          addCoin(cursor + i, 7);
        }
      }

      // Upper bonus platform on every 2nd block cluster
      if (chunkIdx % 2 === 0) {
        addQuestion(cursor + 2, 5, chunkIdx % 6 === 0 ? 'star' : 'coin');
      }

      // Place enemies underneath or on top
      const enemyKind: EnemyKind =
        tpl.stage >= 5 && chunkIdx % 4 === 0
          ? 'spiny'
          : tpl.stage >= 2 && chunkIdx % 3 === 0
          ? 'koopa'
          : 'goomba';
      addEnemy(enemyKind, cursor + 2, 12);
      if (tpl.stage >= 4) {
        addEnemy(tpl.stage >= 6 ? 'bat' : 'goomba', cursor + 3, tpl.stage >= 6 ? 7 : 8);
      }

      cursor += rowLen + 4;
      continue;
    }

    // Elevated platforms + spikes / springs / firebars
    const stairH = Math.min(4, 2 + Math.floor(seed(chunkIdx + 99) * 2));
    for (let i = 0; i < 4; i++) {
      setTile(cursor + i, 13 - stairH, 10);
      addCoin(cursor + i, 12 - stairH);
    }

    if (tpl.stage >= 4 && chunkIdx % 3 === 0) {
      springs.push({ x: (cursor - 2) * TILE, y: 12 * TILE, compressedTimer: 0 });
    }

    if (tpl.stage >= 5 && chunkIdx % 2 === 0) {
      setTile(cursor + 1, 12, 9);
      setTile(cursor + 2, 12, 9);
    }

    if (tpl.stage >= 7 && chunkIdx % 3 === 1) {
      fireBars.push({
        cx: (cursor + 5) * TILE + 8,
        cy: 10 * TILE + 8,
        length: tpl.stage >= 9 ? 5 : 4,
        angle: chunkIdx,
        speed: 1.8 + tpl.stage * 0.12,
      });
      setTile(cursor + 5, 10, 4);
    }

    if (tpl.stage >= 8 && chunkIdx % 2 === 0) {
      addEnemy('cannon_bullet', cursor + 6, 9);
    } else {
      addEnemy(tpl.stage >= 3 ? 'koopa' : 'goomba', cursor + 5, 12);
    }

    cursor += 9;
  }

  // Pre-Boss Supply Area (safe stone step + guaranteed Power-Up before Boss Arena!)
  const supplyX = arenaStart - 6;
  setTile(supplyX, 9, 2);
  addQuestion(supplyX + 1, 9, tpl.stage % 2 === 1 ? 'fire_flower' : 'mushroom');
  setTile(supplyX + 2, 9, 2);
  addCoin(supplyX, 8);
  addCoin(supplyX + 2, 8);

  // Boss Arena Construction (arenaStart .. arenaEnd)
  for (let ax = arenaStart; ax <= W - 1; ax++) {
    setTile(ax, 13, 12);
    setTile(ax, 14, 12);
  }
  // Left & Right arena elevated platforms for dodging bosses
  for (let i = 0; i < 3; i++) {
    setTile(arenaStart + 3 + i, 9, 10);
    setTile(arenaEnd - 5 + i, 9, 10);
  }
  // Right Boss Gate Barrier (removed dynamically when boss is defeated)
  for (let gy = 5; gy <= 12; gy++) {
    setTile(arenaEnd + 1, gy, 12);
  }

  const boss: BossEntity = {
    kind: tpl.bossKind,
    name: tpl.bossName,
    subtitle: tpl.bossSubtitle,
    x: (arenaEnd - 4) * TILE,
    y: 13 * TILE - (tpl.stage === 10 ? 38 : 32),
    vx: -50,
    vy: 0,
    w: tpl.stage === 10 ? 38 : 32,
    h: tpl.stage === 10 ? 38 : 32,
    hp: tpl.bossHp,
    maxHp: tpl.bossHp,
    facing: -1,
    active: false,
    defeated: false,
    invulnTimer: 0,
    actionTimer: 1.2,
    state: 'idle',
    phaseAngle: 0,
    arenaLeft: arenaStart * TILE + 8,
    arenaRight: arenaEnd * TILE - 8,
    floorY: 13 * TILE,
  };

  return {
    stage: tpl.stage,
    name: tpl.name,
    subtitle: tpl.subtitle,
    biome: tpl.biome,
    skyColor: tpl.skyColor,
    widthTiles: W,
    heightTiles: H,
    tiles,
    questionBlocks,
    coins,
    enemies,
    movingPlatforms,
    springs,
    fireBars,
    boss,
    arenaTriggerX: arenaStart * TILE + 16,
    goalX: (arenaEnd + 4) * TILE,
    goalY: 13 * TILE,
    timeLimit: tpl.timeLimit,
    hasPrincess: tpl.stage === 10,
  };
}
