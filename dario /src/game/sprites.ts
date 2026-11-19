import type {
  BiomeTheme,
  BossEntity,
  CoinEntity,
  EnemyEntity,
  FireBar,
  MovingPlatform,
  Particle,
  PlayerState,
  PowerUpEntity,
  ProjectileEntity,
  SpringPad,
  TileType,
} from './types';

export const SCREEN_W = 400;
export const SCREEN_H = 240;
export const TILE = 16;

interface BiomePalette {
  groundTop: string;
  groundFill: string;
  groundDark: string;
  brickFill: string;
  brickMortar: string;
  stoneFill: string;
  stoneLight: string;
  pipeLight: string;
  pipeMid: string;
  pipeDark: string;
  hillFill: string;
  hillDark: string;
  bushFill: string;
  bushLight: string;
  cloudFill: string;
}

const BIOME_PALETTES: Record<BiomeTheme, BiomePalette> = {
  overworld: {
    groundTop: '#E45C10',
    groundFill: '#C84C0C',
    groundDark: '#000000',
    brickFill: '#C84C0C',
    brickMortar: '#000000',
    stoneFill: '#A84800',
    stoneLight: '#F09040',
    pipeLight: '#80D010',
    pipeMid: '#00A800',
    pipeDark: '#005800',
    hillFill: '#00A800',
    hillDark: '#005800',
    bushFill: '#80D010',
    bushLight: '#B8F818',
    cloudFill: '#FCFCFC',
  },
  pipes: {
    groundTop: '#00A800',
    groundFill: '#8C4018',
    groundDark: '#000000',
    brickFill: '#C84C0C',
    brickMortar: '#000000',
    stoneFill: '#787878',
    stoneLight: '#BCBCBC',
    pipeLight: '#80D010',
    pipeMid: '#00A800',
    pipeDark: '#005800',
    hillFill: '#009000',
    hillDark: '#004800',
    bushFill: '#80D010',
    bushLight: '#B8F818',
    cloudFill: '#FCFCFC',
  },
  underground: {
    groundTop: '#0070EC',
    groundFill: '#004098',
    groundDark: '#000000',
    brickFill: '#0058C8',
    brickMortar: '#000000',
    stoneFill: '#2038EC',
    stoneLight: '#6888FF',
    pipeLight: '#3CBCFC',
    pipeMid: '#0070EC',
    pipeDark: '#003080',
    hillFill: '#002858',
    hillDark: '#001030',
    bushFill: '#005898',
    bushLight: '#3CBCFC',
    cloudFill: '#203858',
  },
  sky: {
    groundTop: '#F8F8F8',
    groundFill: '#98C8F8',
    groundDark: '#3060A8',
    brickFill: '#F0B838',
    brickMortar: '#683800',
    stoneFill: '#D8E8F8',
    stoneLight: '#FFFFFF',
    pipeLight: '#F8D878',
    pipeMid: '#E49818',
    pipeDark: '#884800',
    hillFill: '#B8D8F8',
    hillDark: '#88B0E8',
    bushFill: '#E8F4FC',
    bushLight: '#FFFFFF',
    cloudFill: '#FFFFFF',
  },
  desert: {
    groundTop: '#F8B800',
    groundFill: '#C87018',
    groundDark: '#502800',
    brickFill: '#D88020',
    brickMortar: '#482000',
    stoneFill: '#B86018',
    stoneLight: '#F8C868',
    pipeLight: '#A8D838',
    pipeMid: '#589818',
    pipeDark: '#285000',
    hillFill: '#D88828',
    hillDark: '#985010',
    bushFill: '#88B828',
    bushLight: '#B8E848',
    cloudFill: '#FCE8C8',
  },
  forest: {
    groundTop: '#48A848',
    groundFill: '#483020',
    groundDark: '#181008',
    brickFill: '#784828',
    brickMortar: '#181008',
    stoneFill: '#505868',
    stoneLight: '#8898A8',
    pipeLight: '#78C858',
    pipeMid: '#387828',
    pipeDark: '#183810',
    hillFill: '#284838',
    hillDark: '#102818',
    bushFill: '#386838',
    bushLight: '#589848',
    cloudFill: '#485078',
  },
  ice: {
    groundTop: '#E8F8FF',
    groundFill: '#68B8E8',
    groundDark: '#184878',
    brickFill: '#58A8E0',
    brickMortar: '#183868',
    stoneFill: '#88D0F8',
    stoneLight: '#FFFFFF',
    pipeLight: '#B8F0FF',
    pipeMid: '#48A0D8',
    pipeDark: '#185080',
    hillFill: '#A8D8F8',
    hillDark: '#68A8D8',
    bushFill: '#D0F0FF',
    bushLight: '#FFFFFF',
    cloudFill: '#FFFFFF',
  },
  airship: {
    groundTop: '#B87830',
    groundFill: '#683818',
    groundDark: '#180800',
    brickFill: '#884820',
    brickMortar: '#180800',
    stoneFill: '#606878',
    stoneLight: '#A8B0C0',
    pipeLight: '#A8B0C0',
    pipeMid: '#687080',
    pipeDark: '#303840',
    hillFill: '#382068',
    hillDark: '#201040',
    bushFill: '#482878',
    bushLight: '#7850A8',
    cloudFill: '#D8D0E8',
  },
  volcano: {
    groundTop: '#A83018',
    groundFill: '#481810',
    groundDark: '#100000',
    brickFill: '#702018',
    brickMortar: '#000000',
    stoneFill: '#584848',
    stoneLight: '#907878',
    pipeLight: '#E06030',
    pipeMid: '#982810',
    pipeDark: '#481008',
    hillFill: '#481010',
    hillDark: '#280808',
    bushFill: '#682018',
    bushLight: '#A83820',
    cloudFill: '#683838',
  },
  castle: {
    groundTop: '#989898',
    groundFill: '#585858',
    groundDark: '#000000',
    brickFill: '#686868',
    brickMortar: '#000000',
    stoneFill: '#787878',
    stoneLight: '#C0C0C0',
    pipeLight: '#A8A8A8',
    pipeMid: '#686868',
    pipeDark: '#282828',
    hillFill: '#202020',
    hillDark: '#101010',
    bushFill: '#383838',
    bushLight: '#585858',
    cloudFill: '#303030',
  },
};

export function drawBackgroundScenery(
  ctx: CanvasRenderingContext2D,
  biome: BiomeTheme,
  skyColor: string,
  camX: number,
  tick: number
): void {
  const pal = BIOME_PALETTES[biome];
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Stars / embers for dark biomes
  if (biome === 'underground' || biome === 'castle' || biome === 'volcano' || biome === 'forest' || biome === 'airship') {
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 73 - Math.floor(camX * 0.15)) % SCREEN_W + SCREEN_W) % SCREEN_W;
      const sy = (i * 41) % 140 + 12;
      const blink = (tick + i * 7) % 40 < 28;
      if (blink) {
        ctx.fillStyle = biome === 'volcano' ? '#F87820' : '#A8B8D8';
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
  }

  // Clouds (parallax 0.25)
  if (biome !== 'underground' && biome !== 'castle') {
    const cloudSpan = 140;
    const startCloud = Math.floor((camX * 0.25) / cloudSpan) - 1;
    for (let i = startCloud; i < startCloud + 5; i++) {
      const cx = Math.floor(i * cloudSpan - camX * 0.25 + ((i % 2) * 24));
      const cy = 26 + (Math.abs(i * 31) % 44);
      const wide = i % 3 === 0 ? 44 : 30;
      ctx.fillStyle = pal.cloudFill;
      ctx.fillRect(cx + 6, cy + 4, wide, 12);
      ctx.fillRect(cx + 10, cy, wide - 8, 6);
      ctx.fillRect(cx + 2, cy + 8, wide + 8, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(cx + 4, cy + 15, wide + 4, 2);
    }
  }

  // NES Hills with eyes (parallax 0.45)
  const hillSpan = 160;
  const startHill = Math.floor((camX * 0.45) / hillSpan) - 1;
  const baseFloorY = 208;
  for (let i = startHill; i < startHill + 5; i++) {
    const hx = Math.floor(i * hillSpan - camX * 0.45);
    const tall = i % 2 === 0 ? 44 : 28;
    const w = tall === 44 ? 64 : 44;
    ctx.fillStyle = pal.hillFill;
    for (let row = 0; row < tall; row += 2) {
      const shrink = Math.floor((row / tall) * (w * 0.46));
      ctx.fillRect(hx + shrink, baseFloorY - row - 2, w - shrink * 2, 2);
    }
    ctx.fillStyle = '#000000';
    // Classic NES hill eyes
    ctx.fillRect(hx + Math.floor(w * 0.44), baseFloorY - Math.floor(tall * 0.55), 2, 6);
    ctx.fillRect(hx + Math.floor(w * 0.54), baseFloorY - Math.floor(tall * 0.55), 2, 6);
  }

  // NES Bushes (parallax 0.65)
  if (biome !== 'castle' && biome !== 'underground') {
    const bushSpan = 150;
    const startBush = Math.floor((camX * 0.65) / bushSpan) - 1;
    for (let i = startBush; i < startBush + 5; i++) {
      const bx = Math.floor(i * bushSpan - camX * 0.65 + 48);
      const bw = i % 2 === 0 ? 42 : 28;
      ctx.fillStyle = pal.bushFill;
      ctx.fillRect(bx, baseFloorY - 10, bw, 10);
      ctx.fillRect(bx + 6, baseFloorY - 16, bw - 12, 6);
      ctx.fillStyle = pal.bushLight;
      ctx.fillRect(bx + 8, baseFloorY - 14, bw - 16, 4);
      ctx.fillRect(bx + 3, baseFloorY - 8, bw - 6, 3);
    }
  }
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  biome: BiomeTheme,
  tick: number,
  bounceOffset = 0
): void {
  const pal = BIOME_PALETTES[biome];
  const py = Math.floor(y + bounceOffset);
  const px = Math.floor(x);

  switch (tile) {
    case 1: {
      // Ground block (brick-top NES pattern)
      ctx.fillStyle = pal.groundFill;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = pal.groundTop;
      ctx.fillRect(px, py, TILE, 4);
      ctx.fillStyle = pal.groundDark;
      ctx.fillRect(px, py + 7, TILE, 1);
      ctx.fillRect(px + 7, py, 1, 7);
      ctx.fillRect(px + 15, py + 8, 1, 8);
      ctx.fillRect(px + 3, py + 8, 1, 8);
      break;
    }
    case 2: {
      // Breakable brick
      ctx.fillStyle = pal.brickFill;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = pal.brickMortar;
      ctx.fillRect(px, py + 3, TILE, 1);
      ctx.fillRect(px, py + 7, TILE, 1);
      ctx.fillRect(px, py + 11, TILE, 1);
      ctx.fillRect(px, py + 15, TILE, 1);
      ctx.fillRect(px + 7, py, 1, 4);
      ctx.fillRect(px + 3, py + 4, 1, 4);
      ctx.fillRect(px + 11, py + 4, 1, 4);
      ctx.fillRect(px + 7, py + 8, 1, 4);
      ctx.fillRect(px + 15, py + 12, 1, 4);
      break;
    }
    case 3: {
      // Question block (?) with NES shimmer animation
      const pulse = Math.floor(tick / 12) % 3;
      const bodyColor = pulse === 0 ? '#F8B800' : pulse === 1 ? '#E49010' : '#C86810';
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      // Corner rivets
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 2, py + 2, 1, 1);
      ctx.fillRect(px + 13, py + 2, 1, 1);
      ctx.fillRect(px + 2, py + 13, 1, 1);
      ctx.fillRect(px + 13, py + 13, 1, 1);
      // Question mark shadow + gold/brown '?'
      ctx.fillStyle = '#782800';
      ctx.fillRect(px + 5, py + 3, 6, 2);
      ctx.fillRect(px + 9, py + 5, 2, 3);
      ctx.fillRect(px + 7, py + 8, 2, 2);
      ctx.fillRect(px + 7, py + 11, 2, 2);
      ctx.fillStyle = '#FFE890';
      ctx.fillRect(px + 4, py + 3, 6, 2);
      ctx.fillRect(px + 8, py + 5, 2, 2);
      ctx.fillRect(px + 6, py + 7, 2, 2);
      ctx.fillRect(px + 6, py + 11, 2, 2);
      break;
    }
    case 4: {
      // Brown hit / used block (matches user screenshot!)
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#9C4A00';
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 2, py + 2, 1, 1);
      ctx.fillRect(px + 13, py + 2, 1, 1);
      ctx.fillRect(px + 2, py + 13, 1, 1);
      ctx.fillRect(px + 13, py + 13, 1, 1);
      break;
    }
    case 5: {
      // Hard stone / stair block
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = pal.stoneFill;
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = pal.stoneLight;
      ctx.fillRect(px + 1, py + 1, TILE - 2, 2);
      ctx.fillRect(px + 1, py + 1, 2, TILE - 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 4, py + 4, 8, 8);
      ctx.fillStyle = pal.stoneFill;
      ctx.fillRect(px + 5, py + 5, 6, 6);
      break;
    }
    case 6: {
      // Pipe body
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = pal.pipeMid;
      ctx.fillRect(px + 1, py, TILE - 2, TILE);
      ctx.fillStyle = pal.pipeLight;
      ctx.fillRect(px + 2, py, 4, TILE);
      ctx.fillStyle = pal.pipeDark;
      ctx.fillRect(px + 11, py, 4, TILE);
      break;
    }
    case 7: {
      // Pipe lip / top
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = pal.pipeMid;
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = pal.pipeLight;
      ctx.fillRect(px + 2, py + 1, 4, TILE - 2);
      ctx.fillStyle = pal.pipeDark;
      ctx.fillRect(px + 11, py + 1, 4, TILE - 2);
      break;
    }
    case 8: {
      // Animated Lava
      const wave = Math.floor(tick / 8) % 2;
      ctx.fillStyle = '#C81800';
      ctx.fillRect(px, py + 2, TILE, TILE - 2);
      ctx.fillStyle = '#F86800';
      ctx.fillRect(px, py + 2, TILE, 4);
      ctx.fillStyle = '#F8D820';
      ctx.fillRect(px + (wave * 4), py + 2, 4, 2);
      ctx.fillRect(px + 8 + (wave * 4), py + 3, 4, 2);
      break;
    }
    case 9: {
      // Metal spikes
      ctx.fillStyle = '#404858';
      ctx.fillRect(px, py + 12, TILE, 4);
      for (let i = 0; i < 2; i++) {
        const sx = px + i * 8;
        ctx.fillStyle = '#D8E0E8';
        ctx.fillRect(sx + 3, py + 2, 2, 10);
        ctx.fillRect(sx + 2, py + 5, 4, 7);
        ctx.fillRect(sx + 1, py + 8, 6, 4);
        ctx.fillStyle = '#8898A8';
        ctx.fillRect(sx + 5, py + 8, 2, 4);
      }
      break;
    }
    case 10: {
      // Pass-through wooden/cloud bridge
      ctx.fillStyle = '#000000';
      ctx.fillRect(px, py, TILE, 6);
      ctx.fillStyle = biome === 'sky' ? '#FFFFFF' : '#E09038';
      ctx.fillRect(px + 1, py + 1, TILE - 2, 4);
      ctx.fillStyle = biome === 'sky' ? '#A8D0F8' : '#985010';
      ctx.fillRect(px + 1, py + 4, TILE - 2, 1);
      break;
    }
    case 11: {
      // Ice ground
      ctx.fillStyle = '#48A8E0';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#E8FCFF';
      ctx.fillRect(px, py, TILE, 5);
      ctx.fillStyle = '#A8E8FF';
      ctx.fillRect(px + 2, py + 6, 4, 2);
      ctx.fillRect(px + 10, py + 10, 4, 2);
      break;
    }
    case 12: {
      // Castle / Arena stone
      ctx.fillStyle = '#404048';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#707080';
      ctx.fillRect(px + 1, py + 1, 6, 6);
      ctx.fillRect(px + 9, py + 1, 6, 6);
      ctx.fillRect(px + 1, py + 9, 6, 6);
      ctx.fillRect(px + 9, py + 9, 6, 6);
      break;
    }
  }
}

export function drawMovingPlatform(ctx: CanvasRenderingContext2D, p: MovingPlatform, camX: number): void {
  const sx = Math.floor(p.x - camX);
  const sy = Math.floor(p.y);
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx, sy, p.w, p.h);
  ctx.fillStyle = '#F89820';
  ctx.fillRect(sx + 1, sy + 1, p.w - 2, p.h - 2);
  ctx.fillStyle = '#FFE080';
  ctx.fillRect(sx + 2, sy + 2, p.w - 4, 2);
  for (let i = 4; i < p.w - 4; i += 8) {
    ctx.fillStyle = '#883800';
    ctx.fillRect(sx + i, sy + 4, 2, 2);
  }
}

export function drawSpring(ctx: CanvasRenderingContext2D, s: SpringPad, camX: number): void {
  const sx = Math.floor(s.x - camX);
  const sy = Math.floor(s.y);
  const comp = s.compressedTimer > 0 ? 4 : 0;
  ctx.fillStyle = '#B8B8C8';
  ctx.fillRect(sx + 4, sy + 6 + comp, 8, 10 - comp);
  ctx.fillStyle = '#E52521';
  ctx.fillRect(sx + 1, sy + 2 + comp, 14, 5);
  ctx.fillStyle = '#FBD000';
  ctx.fillRect(sx + 3, sy + 3 + comp, 10, 2);
}

export function drawFireBar(ctx: CanvasRenderingContext2D, fb: FireBar, camX: number, tick: number): void {
  const cx = fb.cx - camX;
  const cy = fb.cy;
  ctx.fillStyle = '#707078';
  ctx.fillRect(Math.floor(cx - 4), Math.floor(cy - 4), 8, 8);
  for (let i = 1; i <= fb.length; i++) {
    const fx = cx + Math.cos(fb.angle) * (i * 10);
    const fy = cy + Math.sin(fb.angle) * (i * 10);
    const flicker = (tick + i) % 4 < 2;
    ctx.fillStyle = '#000000';
    ctx.fillRect(Math.floor(fx - 4), Math.floor(fy - 4), 8, 8);
    ctx.fillStyle = flicker ? '#F83800' : '#F8B800';
    ctx.fillRect(Math.floor(fx - 3), Math.floor(fy - 3), 6, 6);
    ctx.fillStyle = '#FFF8A0';
    ctx.fillRect(Math.floor(fx - 1), Math.floor(fy - 1), 2, 2);
  }
}

export function drawCoin(ctx: CanvasRenderingContext2D, c: CoinEntity, camX: number, tick: number): void {
  if (c.collected) return;
  const phase = Math.floor((tick + c.bobOffset) / 8) % 4;
  const w = phase === 0 ? 10 : phase === 2 ? 4 : 7;
  const sx = Math.floor(c.x - camX + (12 - w) / 2);
  const sy = Math.floor(c.y + Math.sin((tick + c.bobOffset) * 0.1) * 1.5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx - 1, sy, w + 2, 14);
  ctx.fillStyle = '#F8B800';
  ctx.fillRect(sx, sy + 1, w, 12);
  if (w >= 7) {
    ctx.fillStyle = '#FFF8A0';
    ctx.fillRect(sx + 1, sy + 2, 2, 9);
    ctx.fillStyle = '#C86800';
    ctx.fillRect(sx + Math.floor(w / 2), sy + 3, 1, 8);
  }
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUpEntity, camX: number, tick: number): void {
  if (p.collected) return;
  const sx = Math.floor(p.x - camX);
  const sy = Math.floor(p.y);

  switch (p.type) {
    case 'mushroom':
    case 'one_up': {
      const capColor = p.type === 'one_up' ? '#00C800' : '#E52521';
      // Cap
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 2, sy, 12, 9);
      ctx.fillRect(sx, sy + 2, 16, 7);
      ctx.fillStyle = capColor;
      ctx.fillRect(sx + 1, sy + 2, 14, 6);
      ctx.fillRect(sx + 3, sy + 1, 10, 2);
      // Spots
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 3, sy + 3, 3, 3);
      ctx.fillRect(sx + 10, sy + 3, 3, 3);
      ctx.fillRect(sx + 7, sy + 1, 2, 2);
      // Stem
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 3, sy + 9, 10, 7);
      ctx.fillStyle = '#FCE0B8';
      ctx.fillRect(sx + 4, sy + 9, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 5, sy + 10, 1, 3);
      ctx.fillRect(sx + 10, sy + 10, 1, 3);
      break;
    }
    case 'fire_flower': {
      const flash = Math.floor(tick / 4) % 2 === 0;
      // Stem & leaves
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx + 7, sy + 9, 2, 7);
      ctx.fillRect(sx + 3, sy + 11, 4, 3);
      ctx.fillRect(sx + 9, sy + 11, 4, 3);
      // Petals
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 2, sy + 1, 12, 9);
      ctx.fillStyle = flash ? '#F83800' : '#F8B800';
      ctx.fillRect(sx + 3, sy + 2, 10, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 5, sy + 3, 6, 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 6, sy + 4, 1, 2);
      ctx.fillRect(sx + 9, sy + 4, 1, 2);
      break;
    }
    case 'star': {
      const colors = ['#F8D800', '#F85800', '#00E870', '#58D0FF'];
      const c = colors[Math.floor(tick / 3) % colors.length];
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 5, sy, 6, 15);
      ctx.fillRect(sx + 1, sy + 4, 14, 5);
      ctx.fillRect(sx + 3, sy + 9, 10, 6);
      ctx.fillStyle = c;
      ctx.fillRect(sx + 6, sy + 1, 4, 12);
      ctx.fillRect(sx + 2, sy + 5, 12, 3);
      ctx.fillRect(sx + 4, sy + 8, 8, 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 6, sy + 5, 1, 3);
      ctx.fillRect(sx + 9, sy + 5, 1, 3);
      break;
    }
    case 'feather': {
      const bob = Math.sin(tick * 0.2) * 1.5;
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 4, Math.floor(sy + 1 + bob), 9, 13);
      ctx.fillStyle = '#38B8FF';
      ctx.fillRect(sx + 5, Math.floor(sy + 2 + bob), 7, 9);
      ctx.fillStyle = '#FBD000';
      ctx.fillRect(sx + 6, Math.floor(sy + 3 + bob), 5, 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 4, Math.floor(sy + 11 + bob), 3, 3);
      break;
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, camX: number, tick: number): void {
  if (p.invulnTimer > 0 && Math.floor(tick / 2) % 2 === 0 && p.starTimer <= 0) {
    return;
  }

  const sx = Math.floor(p.x - camX);
  const sy = Math.floor(p.y);
  const isBig = p.power !== 'small';

  let shirtColor = p.power === 'fire' ? '#FFFFFF' : '#E52521';
  let overallColor = p.power === 'fire' ? '#E52521' : '#1E40AF';
  let hatColor = p.power === 'fire' ? '#FFFFFF' : '#E52521';

  if (p.starTimer > 0) {
    const starCols = ['#FBD000', '#00E070', '#38B8FF', '#FF40A0'];
    const idx = Math.floor(tick / 2) % starCols.length;
    hatColor = starCols[idx];
    shirtColor = starCols[(idx + 1) % starCols.length];
    overallColor = starCols[(idx + 2) % starCols.length];
  }

  ctx.save();
  if (p.facing === -1) {
    ctx.translate(sx + p.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(sx + p.w / 2), 0);
  }

  if (p.featherTimer > 0 && !p.onGround) {
    // Little golden wing aura behind DARIO
    ctx.fillStyle = '#FBD000';
    ctx.fillRect(sx - 3, sy + (isBig ? 10 : 5), 4, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx - 2, sy + (isBig ? 11 : 6), 2, 4);
  }

  const walkOffset = p.onGround && Math.abs(p.vx) > 10 ? (p.walkFrame % 2 === 0 ? 1 : -1) : 0;

  if (!isBig) {
    // Small DARIO (14x16 visual inside 14x16 box)
    // Hat
    ctx.fillStyle = hatColor;
    ctx.fillRect(sx + 2, sy, 9, 3);
    ctx.fillRect(sx + 1, sy + 2, 12, 2);
    // Face
    ctx.fillStyle = '#F8B880';
    ctx.fillRect(sx + 2, sy + 4, 9, 5);
    // Hair/sideburn & eye & mustache
    ctx.fillStyle = '#502800';
    ctx.fillRect(sx + 1, sy + 4, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 8, sy + 5, 2, 2);
    ctx.fillRect(sx + 7, sy + 7, 5, 1);
    // Body / Overalls
    ctx.fillStyle = shirtColor;
    ctx.fillRect(sx + 1, sy + 9, 11, 4);
    ctx.fillStyle = overallColor;
    ctx.fillRect(sx + 3, sy + 10, 7, 4);
    ctx.fillStyle = '#FBD000';
    ctx.fillRect(sx + 4, sy + 10, 1, 1);
    ctx.fillRect(sx + 8, sy + 10, 1, 1);
    // Boots
    ctx.fillStyle = '#602800';
    if (!p.onGround) {
      ctx.fillRect(sx + 1, sy + 13, 4, 3);
      ctx.fillRect(sx + 8, sy + 12, 4, 3);
    } else {
      ctx.fillRect(sx + 2 + walkOffset, sy + 13, 4, 3);
      ctx.fillRect(sx + 8 - walkOffset, sy + 13, 4, 3);
    }
  } else {
    // Big / Fire DARIO (14x26)
    // Hat
    ctx.fillStyle = hatColor;
    ctx.fillRect(sx + 2, sy, 10, 4);
    ctx.fillRect(sx + 1, sy + 3, 13, 2);
    // Face
    ctx.fillStyle = '#F8B880';
    ctx.fillRect(sx + 2, sy + 5, 10, 7);
    ctx.fillStyle = '#502800';
    ctx.fillRect(sx + 1, sy + 5, 3, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 9, sy + 6, 2, 3);
    ctx.fillRect(sx + 7, sy + 10, 6, 2);
    // Torso
    ctx.fillStyle = shirtColor;
    ctx.fillRect(sx + 1, sy + 12, 12, 6);
    ctx.fillStyle = overallColor;
    ctx.fillRect(sx + 3, sy + 13, 8, 9);
    // Overalls buttons
    ctx.fillStyle = '#FBD000';
    ctx.fillRect(sx + 4, sy + 14, 2, 2);
    ctx.fillRect(sx + 8, sy + 14, 2, 2);
    // Gloves
    ctx.fillStyle = '#F8B880';
    ctx.fillRect(sx + (p.onGround ? 0 : 12), sy + 15, 3, 3);
    // Boots
    ctx.fillStyle = '#602800';
    if (!p.onGround) {
      ctx.fillRect(sx + 1, sy + 22, 5, 4);
      ctx.fillRect(sx + 8, sy + 21, 5, 4);
    } else {
      ctx.fillRect(sx + 1 + walkOffset, sy + 22, 5, 4);
      ctx.fillRect(sx + 8 - walkOffset, sy + 22, 5, 4);
    }
  }

  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity, camX: number, tick: number): void {
  if (!e.alive && e.squashedTimer <= 0) return;
  const sx = Math.floor(e.x - camX);
  const sy = Math.floor(e.y);
  const step = Math.floor(tick / 10) % 2;

  switch (e.kind) {
    case 'goomba': {
      if (!e.alive) {
        ctx.fillStyle = '#884010';
        ctx.fillRect(sx + 1, sy + 10, 14, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(sx + 3, sy + 12, 10, 2);
        return;
      }
      // Classic NES Goomba (matching attachment!)
      ctx.fillStyle = '#984010';
      ctx.fillRect(sx + 3, sy + 1, 10, 4);
      ctx.fillRect(sx + 1, sy + 4, 14, 6);
      // Angry brows & eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 3, sy + 4, 3, 2);
      ctx.fillRect(sx + 10, sy + 4, 3, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 4, sy + 6, 2, 3);
      ctx.fillRect(sx + 10, sy + 6, 2, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 5, sy + 7, 1, 2);
      ctx.fillRect(sx + 10, sy + 7, 1, 2);
      // Stem
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(sx + 4, sy + 10, 8, 4);
      // Feet
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + (step === 0 ? 1 : 2), sy + 13, 5, 3);
      ctx.fillRect(sx + (step === 0 ? 10 : 9), sy + 13, 5, 3);
      break;
    }
    case 'koopa': {
      if (e.shellMode) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(sx + 1, sy + 2, 14, 12);
        ctx.fillStyle = '#00A800';
        ctx.fillRect(sx + 2, sy + 3, 12, 8);
        ctx.fillStyle = '#F8E888';
        ctx.fillRect(sx + 3, sy + 11, 10, 3);
        ctx.fillStyle = '#80D010';
        ctx.fillRect(sx + 4, sy + 5, 8, 4);
        return;
      }
      // Shell + head
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx + 2, sy + 6, 12, 10);
      ctx.fillStyle = '#80D010';
      ctx.fillRect(sx + 4, sy + 8, 8, 6);
      ctx.fillStyle = '#F8D858';
      const hx = e.facing === 1 ? sx + 10 : sx + 1;
      ctx.fillRect(hx, sy, 5, 8);
      ctx.fillStyle = '#000000';
      ctx.fillRect(hx + (e.facing === 1 ? 3 : 1), sy + 2, 1, 2);
      ctx.fillStyle = '#E45C10';
      ctx.fillRect(sx + (step === 0 ? 2 : 4), sy + 16, 4, 4);
      ctx.fillRect(sx + (step === 0 ? 10 : 8), sy + 16, 4, 4);
      break;
    }
    case 'piranha': {
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx + 6, sy + 10, 4, 12);
      ctx.fillStyle = '#E52521';
      ctx.fillRect(sx + 1, sy, 14, 11);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 3, sy + 2, 2, 2);
      ctx.fillRect(sx + 10, sy + 3, 2, 2);
      // Mouth teeth
      ctx.fillStyle = step === 0 ? '#FFFFFF' : '#000000';
      ctx.fillRect(sx + 4, sy + 1, 8, 3);
      break;
    }
    case 'bat': {
      const wingY = step === 0 ? 0 : 4;
      ctx.fillStyle = '#482878';
      ctx.fillRect(sx + 4, sy + 4, 8, 8);
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 5, sy + 6, 2, 2);
      ctx.fillRect(sx + 9, sy + 6, 2, 2);
      ctx.fillStyle = '#7848B8';
      ctx.fillRect(sx - 2, sy + 2 + wingY, 6, 4);
      ctx.fillRect(sx + 12, sy + 2 + wingY, 6, 4);
      break;
    }
    case 'spiny': {
      ctx.fillStyle = '#C81800';
      ctx.fillRect(sx + 1, sy + 5, 14, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 3, sy + 1, 2, 4);
      ctx.fillRect(sx + 7, sy, 2, 5);
      ctx.fillRect(sx + 11, sy + 1, 2, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 3, sy + 13, 4, 3);
      ctx.fillRect(sx + 9, sy + 13, 4, 3);
      break;
    }
    case 'cannon_bullet': {
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 1, sy + 2, 14, 12);
      ctx.fillStyle = '#383848';
      ctx.fillRect(sx + 2, sy + 3, 12, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 4, sy + 6, 3, 3);
      break;
    }
    case 'lava_pod': {
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 2, sy + 2, 12, 12);
      ctx.fillStyle = '#F8D800';
      ctx.fillRect(sx + 4, sy + 4, 8, 8);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 5, sy + 6, 2, 2);
      ctx.fillRect(sx + 9, sy + 6, 2, 2);
      break;
    }
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, b: BossEntity, camX: number, tick: number): void {
  if (b.defeated) return;
  if (b.invulnTimer > 0 && Math.floor(tick / 2) % 2 === 0) return;

  const sx = Math.floor(b.x - camX);
  const sy = Math.floor(b.y);
  const step = Math.floor(tick / 8) % 2;

  // Outline box shadow
  ctx.save();
  if (b.facing === 1) {
    ctx.translate(sx + b.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(sx + b.w / 2), 0);
  }

  switch (b.kind) {
    case 'king_goomba': {
      // Giant Crowned Mushroom Boss (32x32)
      ctx.fillStyle = '#FBD000';
      ctx.fillRect(sx + 8, sy, 16, 5);
      ctx.fillRect(sx + 8, sy - 3, 3, 3);
      ctx.fillRect(sx + 15, sy - 4, 3, 4);
      ctx.fillRect(sx + 21, sy - 3, 3, 3);
      ctx.fillStyle = '#984010';
      ctx.fillRect(sx + 2, sy + 5, 28, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 6, sy + 10, 6, 3);
      ctx.fillRect(sx + 20, sy + 10, 6, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 8, sy + 13, 4, 5);
      ctx.fillRect(sx + 20, sy + 13, 4, 5);
      ctx.fillStyle = '#F8C890';
      ctx.fillRect(sx + 8, sy + 21, 16, 7);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + (step ? 4 : 6), sy + 28, 9, 4);
      ctx.fillRect(sx + (step ? 19 : 17), sy + 28, 9, 4);
      break;
    }
    case 'alpha_piranha': {
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx + 10, sy + 16, 12, 16);
      ctx.fillRect(sx + 3, sy + 22, 8, 5);
      ctx.fillRect(sx + 21, sy + 22, 8, 5);
      ctx.fillStyle = '#D81818';
      ctx.fillRect(sx + 2, sy, 28, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 5, sy + 4, 4, 4);
      ctx.fillRect(sx + 22, sy + 5, 4, 4);
      ctx.fillRect(sx + 4, sy + 10, 20, 4);
      break;
    }
    case 'armored_beetle': {
      ctx.fillStyle = '#2038EC';
      ctx.fillRect(sx + 2, sy + 4, 28, 22);
      ctx.fillStyle = '#6888FF';
      ctx.fillRect(sx + 6, sy + 7, 20, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 2, sy + 15, 6, 4);
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 6, sy + 18, 4, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + (step ? 4 : 6), sy + 26, 8, 4);
      ctx.fillRect(sx + (step ? 20 : 18), sy + 26, 8, 4);
      break;
    }
    case 'thunder_falcon': {
      const wing = step ? -5 : 5;
      ctx.fillStyle = '#F8B800';
      ctx.fillRect(sx + 6, sy + 6, 20, 18);
      ctx.fillStyle = '#38B8FF';
      ctx.fillRect(sx - 6, sy + 8 + wing, 14, 8);
      ctx.fillRect(sx + 24, sy + 8 + wing, 14, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 4, sy + 10, 5, 4);
      ctx.fillStyle = '#F85800';
      ctx.fillRect(sx + 1, sy + 14, 7, 4);
      break;
    }
    case 'fire_scorpion': {
      ctx.fillStyle = '#C82800';
      ctx.fillRect(sx + 4, sy + 14, 24, 14);
      // Tail stinger
      ctx.fillStyle = '#F87800';
      ctx.fillRect(sx + 20, sy + 2, 8, 14);
      ctx.fillStyle = '#F8E800';
      ctx.fillRect(sx + 14, sy, 8, 5);
      // Claws
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx - 4, sy + 10 + (step ? 2 : 0), 8, 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 6, sy + 17, 4, 4);
      break;
    }
    case 'phantom_warden': {
      ctx.fillStyle = '#B898FF';
      ctx.fillRect(sx + 4, sy + 2, 24, 26);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 7, sy + 6, 18, 18);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + 8, sy + 10, 5, 5);
      ctx.fillRect(sx + 18, sy + 10, 5, 5);
      ctx.fillStyle = '#FF2060';
      ctx.fillRect(sx + 10, sy + 12, 2, 2);
      ctx.fillRect(sx + 20, sy + 12, 2, 2);
      ctx.fillStyle = '#FBD000';
      ctx.fillRect(sx + 10, sy - 3, 12, 5);
      break;
    }
    case 'crystal_yeti': {
      ctx.fillStyle = '#D8F4FF';
      ctx.fillRect(sx + 2, sy + 2, 30, 30);
      ctx.fillStyle = '#48B8F8';
      ctx.fillRect(sx + 6, sy + 8, 22, 16);
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 8, sy + 10, 4, 4);
      ctx.fillRect(sx + 20, sy + 10, 4, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 10, sy + 18, 12, 4);
      break;
    }
    case 'cannon_mech': {
      ctx.fillStyle = '#485060';
      ctx.fillRect(sx + 2, sy + 4, 30, 26);
      ctx.fillStyle = '#A8B0C0';
      ctx.fillRect(sx + 6, sy + 7, 22, 12);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx - 6, sy + 10, 10, 8);
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 10, sy + 10, 6, 4);
      ctx.fillStyle = '#FBD000';
      ctx.fillRect(sx + 4, sy + 28, 10, 6);
      ctx.fillRect(sx + 20, sy + 28, 10, 6);
      break;
    }
    case 'magma_dragon': {
      ctx.fillStyle = '#981000';
      ctx.fillRect(sx + 4, sy + 6, 26, 24);
      ctx.fillStyle = '#F87800';
      ctx.fillRect(sx + 8, sy + 14, 16, 14);
      // Wings
      ctx.fillStyle = '#500800';
      ctx.fillRect(sx + 22, sy + (step ? 0 : 4), 14, 12);
      // Horns & eye
      ctx.fillStyle = '#F8E888';
      ctx.fillRect(sx + 10, sy, 4, 6);
      ctx.fillRect(sx + 20, sy, 4, 6);
      ctx.fillStyle = '#F8E800';
      ctx.fillRect(sx + 7, sy + 9, 4, 4);
      break;
    }
    case 'supreme_koopa_king': {
      // Classic Bowser-inspired 38x38 Dragon-Turtle King
      ctx.fillStyle = '#008800';
      ctx.fillRect(sx + 6, sy + 4, 26, 28);
      // Spikes on shell
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 28, sy + 8, 6, 4);
      ctx.fillRect(sx + 30, sy + 16, 6, 4);
      ctx.fillRect(sx + 28, sy + 24, 6, 4);
      // Belly
      ctx.fillStyle = '#F8D868';
      ctx.fillRect(sx + 6, sy + 14, 14, 16);
      // Head + Crown + Horns
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx, sy + 2, 16, 14);
      ctx.fillStyle = '#FBD000';
      ctx.fillRect(sx + 4, sy - 4, 10, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 12, sy, 4, 5);
      ctx.fillStyle = '#F83800';
      ctx.fillRect(sx + 3, sy + 5, 4, 4);
      // Claws
      ctx.fillStyle = '#00A800';
      ctx.fillRect(sx - 4, sy + 16 + (step ? 2 : 0), 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx + (step ? 4 : 7), sy + 32, 10, 6);
      ctx.fillRect(sx + (step ? 20 : 17), sy + 32, 10, 6);
      break;
    }
  }

  ctx.restore();
}

export function drawPrincess(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, tick: number): void {
  const sx = Math.floor(x - camX);
  const sy = Math.floor(y);
  const wave = Math.floor(tick / 14) % 2 === 0;

  // Crown
  ctx.fillStyle = '#FBD000';
  ctx.fillRect(sx + 4, sy, 8, 3);
  ctx.fillRect(sx + 4, sy - 2, 2, 2);
  ctx.fillRect(sx + 7, sy - 3, 2, 3);
  ctx.fillRect(sx + 10, sy - 2, 2, 2);
  // Hair
  ctx.fillStyle = '#F8B800';
  ctx.fillRect(sx + 2, sy + 3, 12, 8);
  // Face
  ctx.fillStyle = '#FCE0B8';
  ctx.fillRect(sx + 4, sy + 4, 8, 6);
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx + 5, sy + 6, 1, 2);
  ctx.fillRect(sx + 9, sy + 6, 1, 2);
  // Dress
  ctx.fillStyle = '#FF70B8';
  ctx.fillRect(sx + 3, sy + 10, 10, 7);
  ctx.fillRect(sx + 1, sy + 16, 14, 10);
  ctx.fillStyle = '#FFB8E0';
  ctx.fillRect(sx + 5, sy + 12, 6, 12);
  // Waving arm
  ctx.fillStyle = '#FCE0B8';
  ctx.fillRect(sx + (wave ? 0 : 1), sy + (wave ? 9 : 12), 3, 3);
  // Floating Heart above princess
  const hy = sy - 10 - (wave ? 2 : 0);
  ctx.fillStyle = '#FF2060';
  ctx.fillRect(sx + 5, hy, 2, 2);
  ctx.fillRect(sx + 9, hy, 2, 2);
  ctx.fillRect(sx + 4, hy + 2, 8, 2);
  ctx.fillRect(sx + 6, hy + 4, 4, 2);
}

export function drawGoalFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  camX: number,
  hasPrincess: boolean,
  tick: number,
  unlocked: boolean
): void {
  const sx = Math.floor(x - camX);
  const sy = Math.floor(y);

  // Small castle behind goal
  ctx.fillStyle = '#9898A8';
  ctx.fillRect(sx + 24, sy - 48, 44, 48);
  ctx.fillStyle = '#585868';
  ctx.fillRect(sx + 24, sy - 54, 8, 6);
  ctx.fillRect(sx + 42, sy - 54, 8, 6);
  ctx.fillRect(sx + 60, sy - 54, 8, 6);
  // Castle arch door
  ctx.fillStyle = '#000000';
  ctx.fillRect(sx + 38, sy - 24, 16, 24);

  if (hasPrincess) {
    drawPrincess(ctx, x + 12, y - 26, camX, tick);
    return;
  }

  // Flagpole
  ctx.fillStyle = '#D8D8D8';
  ctx.fillRect(sx, sy - 96, 3, 96);
  ctx.fillStyle = unlocked ? '#00E040' : '#FBD000';
  ctx.fillRect(sx - 2, sy - 100, 7, 6);

  // Flag
  const flagY = unlocked ? sy - 92 : sy - 28;
  ctx.fillStyle = unlocked ? '#00C830' : '#E52521';
  ctx.fillRect(sx + 3, flagY, 20, 14);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(sx + 8, flagY + 4, 6, 6);
}

export function drawProjectile(ctx: CanvasRenderingContext2D, pr: ProjectileEntity, camX: number, tick: number): void {
  if (!pr.alive) return;
  const sx = Math.floor(pr.x - camX);
  const sy = Math.floor(pr.y);

  if (pr.kind === 'fireball') {
    const f = Math.floor(tick / 3) % 2;
    ctx.fillStyle = f ? '#F83800' : '#F8B800';
    ctx.fillRect(sx, sy, 8, 8);
    ctx.fillStyle = '#FFF8A0';
    ctx.fillRect(sx + 2, sy + 2, 4, 4);
  } else if (pr.kind === 'ice_boulder') {
    ctx.fillStyle = '#48B8F8';
    ctx.fillRect(sx, sy, 10, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 2, sy + 2, 5, 4);
  } else if (pr.kind === 'cannonball') {
    ctx.fillStyle = '#181820';
    ctx.fillRect(sx, sy, 10, 10);
    ctx.fillStyle = '#687080';
    ctx.fillRect(sx + 2, sy + 2, 3, 3);
  } else if (pr.kind === 'hammer') {
    ctx.fillStyle = '#A86018';
    ctx.fillRect(sx + 3, sy + 2, 3, 8);
    ctx.fillStyle = '#D8D8E0';
    ctx.fillRect(sx, sy, 9, 5);
  } else {
    ctx.fillStyle = '#FF3880';
    ctx.fillRect(sx, sy, 8, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 2, sy + 2, 4, 4);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number): void {
  for (const pt of particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.floor(pt.x - camX), Math.floor(pt.y), pt.size, pt.size);
  }
}
