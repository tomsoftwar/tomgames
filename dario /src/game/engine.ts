import { retroAudio } from './audio';
import { buildLevel } from './levels';
import {
  drawBackgroundScenery,
  drawBoss,
  drawCoin,
  drawEnemy,
  drawFireBar,
  drawGoalFlag,
  drawMovingPlatform,
  drawParticles,
  drawPlayer,
  drawPowerUp,
  drawProjectile,
  drawSpring,
  drawTile,
  SCREEN_H,
  SCREEN_W,
  TILE,
} from './sprites';
import type {
  DarioPowerState,
  FloatingText,
  GameScreenState,
  HudSnapshot,
  InputState,
  LevelConfig,
  Particle,
  PlayerState,
  PowerUpEntity,
  PowerUpType,
  ProjectileEntity,
  TileType,
} from './types';

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isSolidTile(t: TileType): boolean {
  return t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6 || t === 7 || t === 11 || t === 12;
}

export class DarioGameEngine {
  public screen: GameScreenState = 'TITLE_MENU';
  public stage = 1;
  public score = 0;
  public coins = 0;
  public lives = 4;
  public nextLifeScore = 5000;
  public timeLeft = 240;
  public princessSaved = false;

  private level: LevelConfig;
  private player: PlayerState;
  private powerUps: PowerUpEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  private camX = 0;
  private tick = 0;
  private introTimer = 0;
  private stageClearTimer = 0;
  private nextEntityId = 5000;
  private checkpointX = 48;
  private onHudChange?: (hud: HudSnapshot) => void;
  private hudSyncCounter = 0;

  constructor(onHudChange?: (hud: HudSnapshot) => void) {
    this.onHudChange = onHudChange;
    this.level = buildLevel(1);
    this.player = this.createPlayer(48, 192, 'small');
  }

  private createPlayer(x: number, y: number, power: DarioPowerState): PlayerState {
    const h = power === 'small' ? 16 : 26;
    return {
      x,
      y: y - (h - 16),
      vx: 0,
      vy: 0,
      w: 14,
      h,
      facing: 1,
      onGround: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      power,
      starTimer: 0,
      featherTimer: 0,
      invulnTimer: 0,
      fireCooldown: 0,
      walkFrame: 0,
      walkTimer: 0,
      dead: false,
      deathTimer: 0,
      hasWonStage: false,
    };
  }

  public startNewGame(startStage = 1): void {
    retroAudio.unlock();
    this.stage = startStage;
    this.score = 0;
    this.coins = 0;
    this.lives = 4;
    this.nextLifeScore = 5000;
    this.princessSaved = false;
    this.loadStage(startStage, 'small');
    this.screen = 'STAGE_INTRO';
    this.introTimer = 1.6;
    retroAudio.stopMusic();
    this.emitHud();
  }

  public togglePause(): void {
    if (this.screen === 'PLAYING') {
      this.screen = 'PAUSED';
      retroAudio.stopMusic();
      this.emitHud();
    } else if (this.screen === 'PAUSED') {
      this.screen = 'PLAYING';
      this.resumeStageMusic();
      this.emitHud();
    }
  }

  public toggleMute(): boolean {
    const muted = retroAudio.toggleMute();
    this.emitHud();
    return muted;
  }

  private loadStage(stageNum: number, carryPower: DarioPowerState): void {
    this.level = buildLevel(stageNum);
    this.timeLeft = this.level.timeLimit;
    this.checkpointX = 48;
    this.player = this.createPlayer(48, 192, carryPower);
    this.powerUps = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.camX = 0;
  }

  private respawnAtCheckpoint(): void {
    const savedX = this.checkpointX;
    this.level = buildLevel(this.stage);
    this.timeLeft = this.level.timeLimit;
    this.player = this.createPlayer(savedX, 160, 'small');
    this.player.invulnTimer = 1.4;
    this.powerUps = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.camX = Math.max(0, savedX - SCREEN_W * 0.35);
    this.screen = 'STAGE_INTRO';
    this.introTimer = 1.3;
    this.emitHud();
  }

  private resumeStageMusic(): void {
    if (this.player.starTimer > 0) {
      retroAudio.startMusic('star');
    } else if (this.level.boss.active && !this.level.boss.defeated) {
      retroAudio.startMusic('boss');
    } else if (
      this.level.biome === 'underground' ||
      this.level.biome === 'castle' ||
      this.level.biome === 'volcano' ||
      this.level.biome === 'forest'
    ) {
      retroAudio.startMusic('underground');
    } else {
      retroAudio.startMusic('overworld');
    }
  }

  private addScore(points: number, x?: number, y?: number, label?: string, color = '#FFFFFF'): void {
    this.score += points;
    while (this.score >= this.nextLifeScore) {
      this.lives += 1;
      this.nextLifeScore += 5000;
      retroAudio.playOneUp();
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 18,
        text: '+1 VIDA! (5000 PTS)',
        color: '#4ADE80',
        life: 1.5,
      });
    }
    if (x !== undefined && y !== undefined) {
      this.floatingTexts.push({
        x,
        y,
        text: label ?? `+${points}`,
        color,
        life: 0.9,
      });
    }
  }

  private spawnParticles(x: number, y: number, color: string, count = 8, speed = 110): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = speed * (0.5 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 45,
        size: Math.random() > 0.4 ? 3 : 2,
        color,
        life: 0.65,
        maxLife: 0.65,
        gravity: true,
      });
    }
  }

  public getHudSnapshot(): HudSnapshot {
    return {
      screen: this.screen,
      stage: this.stage,
      stageName: this.level.name,
      score: this.score,
      coins: this.coins,
      lives: this.lives,
      nextLifeScore: this.nextLifeScore,
      timeLeft: Math.ceil(this.timeLeft),
      power: this.player.power,
      starActive: this.player.starTimer > 0,
      featherActive: this.player.featherTimer > 0,
      bossActive: this.level.boss.active && !this.level.boss.defeated,
      bossName: this.level.boss.name,
      bossSubtitle: this.level.boss.subtitle,
      bossHp: Math.max(0, this.level.boss.hp),
      bossMaxHp: this.level.boss.maxHp,
      princessSaved: this.princessSaved,
      muted: retroAudio.isMuted(),
    };
  }

  private emitHud(): void {
    this.onHudChange?.(this.getHudSnapshot());
  }

  public update(dt: number, input: InputState): void {
    const baseDt = Math.min(dt, 0.04);
    const clampedDt = baseDt * 1.2;
    this.tick++;

    if (this.screen === 'TITLE_MENU' || this.screen === 'PAUSED' || this.screen === 'GAME_OVER' || this.screen === 'VICTORY') {
      return;
    }

    if (this.screen === 'STAGE_INTRO') {
      this.introTimer -= clampedDt;
      if (this.introTimer <= 0) {
        this.screen = 'PLAYING';
        this.resumeStageMusic();
        this.emitHud();
      }
      return;
    }

    if (this.screen === 'STAGE_CLEAR') {
      this.stageClearTimer -= clampedDt;
      this.updateParticles(clampedDt);
      if (this.stageClearTimer <= 0) {
        if (this.stage < 10) {
          const carry = this.player.power;
          this.stage += 1;
          this.loadStage(this.stage, carry);
          this.screen = 'STAGE_INTRO';
          this.introTimer = 1.6;
          this.emitHud();
        } else {
          this.princessSaved = true;
          this.screen = 'VICTORY';
          retroAudio.playVictoryFanfare();
          this.emitHud();
        }
      }
      return;
    }

    // Playing state
    if (!this.player.dead && !this.player.hasWonStage) {
      this.timeLeft -= baseDt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.killPlayer();
      }
    }

    // Checkpoint halfway through the stage
    const midX = (this.level.widthTiles * TILE) * 0.45;
    if (this.player.x > midX && this.checkpointX < midX) {
      this.checkpointX = midX;
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 16,
        text: 'CHECKPOINT!',
        color: '#FBD000',
        life: 1.2,
      });
    }

    // Question block bounce decay
    for (const key of Object.keys(this.level.questionBlocks)) {
      const qb = this.level.questionBlocks[key];
      if (qb.bounceY < 0) {
        qb.bounceY = Math.min(0, qb.bounceY + 45 * clampedDt);
      }
    }

    this.updateMovingPlatforms(clampedDt);
    this.updateSprings(clampedDt);
    this.updateFireBars(clampedDt);
    this.updatePlayer(clampedDt, input);
    this.updatePowerUps(clampedDt);
    this.updateEnemies(clampedDt);
    this.updateBoss(clampedDt);
    this.updateProjectiles(clampedDt);
    this.updateParticles(clampedDt);

    // Camera follow (locks on Boss Arena when active)
    if (this.level.boss.active && !this.level.boss.defeated) {
      const targetCam = this.level.boss.arenaLeft - 8;
      this.camX += (targetCam - this.camX) * Math.min(1, clampedDt * 8);
    } else {
      const targetCam = Math.max(0, Math.min(this.level.widthTiles * TILE - SCREEN_W, this.player.x - SCREEN_W * 0.36));
      if (targetCam > this.camX || !this.level.boss.active) {
        this.camX += (targetCam - this.camX) * Math.min(1, clampedDt * 10);
      }
    }

    this.hudSyncCounter++;
    if (this.hudSyncCounter >= 6) {
      this.hudSyncCounter = 0;
      this.emitHud();
    }
  }

  private updateMovingPlatforms(dt: number): void {
    for (const mp of this.level.movingPlatforms) {
      const oldX = mp.x;
      const oldY = mp.y;
      mp.t += dt * mp.speed * mp.dir;
      if (mp.t >= 1) {
        mp.t = 1;
        mp.dir = -1;
      } else if (mp.t <= 0) {
        mp.t = 0;
        mp.dir = 1;
      }
      mp.x = mp.startX + (mp.endX - mp.startX) * mp.t;
      mp.y = mp.startY + (mp.endY - mp.startY) * mp.t;
      mp.vx = (mp.x - oldX) / Math.max(0.001, dt);
      mp.vy = (mp.y - oldY) / Math.max(0.001, dt);
    }
  }

  private updateSprings(dt: number): void {
    for (const s of this.level.springs) {
      if (s.compressedTimer > 0) {
        s.compressedTimer = Math.max(0, s.compressedTimer - dt);
      }
    }
  }

  private updateFireBars(dt: number): void {
    for (const fb of this.level.fireBars) {
      fb.angle += fb.speed * dt;
      if (!this.player.dead && this.player.starTimer <= 0 && this.player.invulnTimer <= 0) {
        for (let i = 1; i <= fb.length; i++) {
          const fx = fb.cx + Math.cos(fb.angle) * (i * 10) - 3;
          const fy = fb.cy + Math.sin(fb.angle) * (i * 10) - 3;
          if (aabb(this.player.x + 2, this.player.y + 2, this.player.w - 4, this.player.h - 4, fx, fy, 6, 6)) {
            this.damagePlayer();
            break;
          }
        }
      }
    }
  }

  private updatePlayer(dt: number, input: InputState): void {
    const p = this.player;

    if (p.dead) {
      p.deathTimer -= dt;
      p.vy += 900 * dt;
      p.y += p.vy * dt;
      if (p.deathTimer <= 0) {
        if (this.lives > 0) {
          this.respawnAtCheckpoint();
        } else {
          this.screen = 'GAME_OVER';
          retroAudio.playGameOver();
          this.emitHud();
        }
      }
      return;
    }

    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.fireCooldown > 0) p.fireCooldown = Math.max(0, p.fireCooldown - dt);

    if (p.starTimer > 0) {
      const prev = p.starTimer;
      p.starTimer = Math.max(0, p.starTimer - dt);
      if (prev > 0 && p.starTimer === 0) {
        this.resumeStageMusic();
      }
    }
    if (p.featherTimer > 0) {
      p.featherTimer = Math.max(0, p.featherTimer - dt);
    }

    // Horizontal movement
    const sprinting = input.fire || p.starTimer > 0 || p.featherTimer > 0;
    const maxSpeed = sprinting ? 178 : 138;
    const accel = p.onGround ? 920 : 620;
    const tileUnderFoot = this.getTileAtPixel(p.x + p.w / 2, p.y + p.h + 2);
    const onIce = tileUnderFoot === 11;
    const friction = p.onGround ? (onIce ? 210 : 780) : 140;

    if (input.left && !input.right) {
      p.vx -= accel * dt;
      p.facing = -1;
    } else if (input.right && !input.left) {
      p.vx += accel * dt;
      p.facing = 1;
    } else {
      if (p.vx > 0) {
        p.vx = Math.max(0, p.vx - friction * dt);
      } else if (p.vx < 0) {
        p.vx = Math.min(0, p.vx + friction * dt);
      }
    }
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    // Walk cycle
    if (p.onGround && Math.abs(p.vx) > 15) {
      p.walkTimer += dt * (Math.abs(p.vx) / 25);
      if (p.walkTimer >= 1) {
        p.walkTimer = 0;
        p.walkFrame = (p.walkFrame + 1) % 3;
      }
    } else {
      p.walkFrame = 0;
    }

    // Coyote & Jump Buffer
    if (p.onGround) {
      p.coyoteTimer = 0.09;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (input.jumpJustPressed) {
      p.jumpBufferTimer = 0.1;
    } else {
      p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    }

    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      const jumpVel = p.featherTimer > 0 ? -495 : -448;
      p.vy = jumpVel;
      p.onGround = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      retroAudio.playJump(p.power !== 'small');
    }

    // Variable jump height
    if (!input.jump && p.vy < -150) {
      p.vy *= 0.58;
    }

    // Fireball shooting
    if (input.fireJustPressed && p.power === 'fire' && p.fireCooldown <= 0) {
      const activeFireballs = this.projectiles.filter((pr) => pr.fromPlayer && pr.alive).length;
      if (activeFireballs < 3) {
        p.fireCooldown = 0.25;
        this.projectiles.push({
          id: this.nextEntityId++,
          fromPlayer: true,
          kind: 'fireball',
          x: p.facing === 1 ? p.x + p.w : p.x - 8,
          y: p.y + 8,
          vx: p.facing * 240,
          vy: 40,
          w: 8,
          h: 8,
          bounces: 0,
          alive: true,
          life: 2.2,
        });
        retroAudio.playFireball();
      }
    }

    // Gravity
    const gravity = p.featherTimer > 0 && p.vy > 0 ? 740 : 1180;
    p.vy = Math.min(480, p.vy + gravity * dt);

    // Move X + collide
    p.x += p.vx * dt;
    const minBoundX =
      this.level.boss.active && !this.level.boss.defeated ? this.level.boss.arenaLeft : 0;
    const maxBoundX = this.level.widthTiles * TILE - p.w;
    if (p.x < minBoundX) {
      p.x = minBoundX;
      p.vx = 0;
    }
    if (p.x > maxBoundX) {
      p.x = maxBoundX;
      p.vx = 0;
    }
    this.resolveHorizontalTiles(p);

    // Move Y + collide
    p.y += p.vy * dt;
    p.onGround = false;
    this.resolveVerticalTiles(p);

    // Moving platform support
    for (const mp of this.level.movingPlatforms) {
      if (
        p.vy >= 0 &&
        p.x + p.w > mp.x + 1 &&
        p.x < mp.x + mp.w - 1 &&
        p.y + p.h >= mp.y - 2 &&
        p.y + p.h <= mp.y + 10
      ) {
        p.y = mp.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.x += mp.vx * dt;
      }
    }

    // Spring pads
    for (const sp of this.level.springs) {
      if (aabb(p.x, p.y, p.w, p.h, sp.x, sp.y + 2, 16, 14) && p.vy >= 0) {
        p.y = sp.y - p.h;
        p.vy = -550;
        p.onGround = false;
        sp.compressedTimer = 0.25;
        retroAudio.playSpring();
      }
    }

    // Coins
    for (const c of this.level.coins) {
      if (!c.collected && aabb(p.x, p.y, p.w, p.h, c.x, c.y, 12, 14)) {
        c.collected = true;
        this.coins += 1;
        this.addScore(100, c.x, c.y - 4, '+100', '#FBD000');
        retroAudio.playCoin();
      }
    }

    // Hazards (Lava & Spikes & Pit)
    if (p.y > SCREEN_H + 12) {
      this.killPlayer();
      return;
    }

    const leftTx = Math.floor((p.x + 2) / TILE);
    const rightTx = Math.floor((p.x + p.w - 2) / TILE);
    const topTy = Math.floor((p.y + 2) / TILE);
    const botTy = Math.floor((p.y + p.h - 2) / TILE);
    for (let ty = topTy; ty <= botTy; ty++) {
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const t = this.getTile(tx, ty);
        if (t === 8) {
          this.killPlayer();
          return;
        }
        if (t === 9 && p.starTimer <= 0 && p.invulnTimer <= 0) {
          this.damagePlayer();
          return;
        }
      }
    }

    // Boss Arena Trigger
    if (!this.level.boss.active && !this.level.boss.defeated && p.x >= this.level.arenaTriggerX) {
      this.level.boss.active = true;
      this.checkpointX = this.level.arenaTriggerX;
      retroAudio.startMusic('boss');
      this.floatingTexts.push({
        x: this.level.boss.x - 16,
        y: this.level.boss.y - 18,
        text: `CHEFÃO: ${this.level.boss.name.toUpperCase()}!`,
        color: '#FF4040',
        life: 2.0,
      });
      this.emitHud();
    }

    // Goal Flag / Princess check
    if (this.level.boss.defeated && p.x + p.w >= this.level.goalX) {
      p.hasWonStage = true;
      const timeBonus = Math.ceil(this.timeLeft) * 10;
      this.addScore(timeBonus + (this.level.hasPrincess ? 5000 : 1000), p.x, p.y - 18, this.level.hasPrincess ? 'PRINCESA SALVA!' : 'FASE CONCLUÍDA!', '#FBD000');
      this.spawnParticles(this.level.goalX + 8, this.level.goalY - 30, '#FBD000', 22, 160);
      this.spawnParticles(this.level.goalX + 8, this.level.goalY - 30, '#FF4080', 18, 140);
      if (this.level.hasPrincess) {
        this.princessSaved = true;
        this.screen = 'VICTORY';
        retroAudio.playVictoryFanfare();
      } else {
        this.screen = 'STAGE_CLEAR';
        this.stageClearTimer = 2.4;
        retroAudio.playStageClear();
      }
      this.emitHud();
    }
  }

  private getTile(tx: number, ty: number): TileType {
    if (ty < 0 || ty >= this.level.heightTiles || tx < 0 || tx >= this.level.widthTiles) {
      return 0;
    }
    return this.level.tiles[ty][tx];
  }

  private getTileAtPixel(px: number, py: number): TileType {
    return this.getTile(Math.floor(px / TILE), Math.floor(py / TILE));
  }

  private resolveHorizontalTiles(p: PlayerState): void {
    const topTy = Math.floor((p.y + 2) / TILE);
    const botTy = Math.floor((p.y + p.h - 2) / TILE);
    if (p.vx > 0) {
      const rightTx = Math.floor((p.x + p.w) / TILE);
      for (let ty = topTy; ty <= botTy; ty++) {
        if (isSolidTile(this.getTile(rightTx, ty))) {
          p.x = rightTx * TILE - p.w;
          p.vx = 0;
          break;
        }
      }
    } else if (p.vx < 0) {
      const leftTx = Math.floor(p.x / TILE);
      for (let ty = topTy; ty <= botTy; ty++) {
        if (isSolidTile(this.getTile(leftTx, ty))) {
          p.x = (leftTx + 1) * TILE;
          p.vx = 0;
          break;
        }
      }
    }
  }

  private resolveVerticalTiles(p: PlayerState): void {
    const leftTx = Math.floor((p.x + 2) / TILE);
    const rightTx = Math.floor((p.x + p.w - 2) / TILE);

    if (p.vy >= 0) {
      const botTy = Math.floor((p.y + p.h) / TILE);
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const t = this.getTile(tx, botTy);
        if (isSolidTile(t) || (t === 10 && p.y + p.h - p.vy * 0.02 <= botTy * TILE + 6)) {
          p.y = botTy * TILE - p.h;
          p.vy = 0;
          p.onGround = true;
          break;
        }
      }
    } else if (p.vy < 0) {
      const topTy = Math.floor(p.y / TILE);
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const t = this.getTile(tx, topTy);
        if (isSolidTile(t)) {
          p.y = (topTy + 1) * TILE;
          p.vy = 0;
          this.hitBlockFromBelow(tx, topTy);
          break;
        }
      }
    }
  }

  private hitBlockFromBelow(tx: number, ty: number): void {
    const t = this.getTile(tx, ty);
    const bx = tx * TILE;
    const by = ty * TILE;

    // Defeat any enemy standing on top of this block
    for (const e of this.level.enemies) {
      if (e.alive && aabb(e.x, e.y, e.w, e.h, bx, by - 6, TILE, 8)) {
        e.alive = false;
        e.squashedTimer = 0.25;
        this.addScore(200, e.x, e.y - 6, '+200');
        retroAudio.playStomp();
      }
    }

    if (t === 3) {
      // Question Block!
      this.level.tiles[ty][tx] = 4; // Turn into brown hit block (like screenshot!)
      const meta = this.level.questionBlocks[`${tx},${ty}`];
      if (meta && !meta.hit) {
        meta.hit = true;
        meta.bounceY = -6;
        if (meta.loot === 'coin') {
          this.coins += 1;
          this.addScore(100, bx, by - 14, '+100', '#FBD000');
          this.spawnParticles(bx + 8, by - 4, '#FBD000', 6, 90);
          retroAudio.playCoin();
        } else {
          this.spawnPowerUp(meta.loot, bx, by - TILE);
          retroAudio.playPowerUpAppear();
        }
      } else {
        retroAudio.playBump();
      }
    } else if (t === 2) {
      if (this.player.power !== 'small') {
        this.level.tiles[ty][tx] = 0;
        this.addScore(50);
        this.spawnParticles(bx + 8, by + 8, '#C84C0C', 8, 120);
        retroAudio.playBrickBreak();
      } else {
        retroAudio.playBump();
      }
    } else {
      retroAudio.playBump();
    }
  }

  private spawnPowerUp(type: PowerUpType, x: number, y: number): void {
    this.powerUps.push({
      id: this.nextEntityId++,
      type,
      x,
      y,
      vx: type === 'fire_flower' ? 0 : 48,
      vy: type === 'star' ? -150 : 0,
      w: 16,
      h: 16,
      spawnTimer: 0.25,
      collected: false,
    });
  }

  private updatePowerUps(dt: number): void {
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      if (pu.spawnTimer > 0) {
        pu.spawnTimer -= dt;
        continue;
      }

      if (pu.type !== 'fire_flower') {
        pu.vy = Math.min(360, pu.vy + 900 * dt);
        pu.x += pu.vx * dt;
        const leftTx = Math.floor(pu.x / TILE);
        const rightTx = Math.floor((pu.x + pu.w) / TILE);
        const midTy = Math.floor((pu.y + pu.h / 2) / TILE);
        if (pu.vx > 0 && isSolidTile(this.getTile(rightTx, midTy))) {
          pu.x = rightTx * TILE - pu.w;
          pu.vx = -Math.abs(pu.vx);
        } else if (pu.vx < 0 && isSolidTile(this.getTile(leftTx, midTy))) {
          pu.x = (leftTx + 1) * TILE;
          pu.vx = Math.abs(pu.vx);
        }

        pu.y += pu.vy * dt;
        const botTy = Math.floor((pu.y + pu.h) / TILE);
        const cLeft = Math.floor((pu.x + 2) / TILE);
        const cRight = Math.floor((pu.x + pu.w - 2) / TILE);
        if (pu.vy >= 0 && (isSolidTile(this.getTile(cLeft, botTy)) || isSolidTile(this.getTile(cRight, botTy)))) {
          pu.y = botTy * TILE - pu.h;
          pu.vy = pu.type === 'star' ? -240 : 0;
        }
      }

      if (aabb(this.player.x, this.player.y, this.player.w, this.player.h, pu.x, pu.y, pu.w, pu.h)) {
        pu.collected = true;
        this.applyPowerUp(pu.type);
      }
    }
  }

  private applyPowerUp(type: PowerUpType): void {
    const p = this.player;
    this.addScore(1000, p.x, p.y - 10, '+1000', '#4ADE80');

    if (type === 'mushroom') {
      if (p.power === 'small') {
        p.power = 'big';
        p.y -= 10;
        p.h = 26;
      }
      retroAudio.playPowerUpCollect();
    } else if (type === 'fire_flower') {
      if (p.power === 'small') {
        p.y -= 10;
        p.h = 26;
      }
      p.power = 'fire';
      retroAudio.playPowerUpCollect();
      this.floatingTexts.push({ x: p.x, y: p.y - 18, text: 'PODER DE FOGO!', color: '#F97316', life: 1.2 });
    } else if (type === 'star') {
      p.starTimer = 10;
      retroAudio.playPowerUpCollect();
      retroAudio.startMusic('star');
      this.floatingTexts.push({ x: p.x, y: p.y - 18, text: 'INVENCÍVEL!', color: '#FACC15', life: 1.2 });
    } else if (type === 'feather') {
      p.featherTimer = 15;
      retroAudio.playPowerUpCollect();
      this.floatingTexts.push({ x: p.x, y: p.y - 18, text: 'ASAS TURBO!', color: '#38BDF8', life: 1.2 });
    } else if (type === 'one_up') {
      this.lives += 1;
      retroAudio.playOneUp();
      this.floatingTexts.push({ x: p.x, y: p.y - 18, text: '+1 VIDA!', color: '#4ADE80', life: 1.4 });
    }
    this.emitHud();
  }

  private damagePlayer(): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.starTimer > 0 || p.dead) return;
    if (p.power !== 'small') {
      p.power = 'small';
      p.h = 16;
      p.y += 10;
      p.invulnTimer = 1.6;
      retroAudio.playHurt();
      this.spawnParticles(p.x + 7, p.y + 8, '#FFFFFF', 10, 95);
      this.emitHud();
    } else {
      this.killPlayer();
    }
  }

  private killPlayer(): void {
    const p = this.player;
    if (p.dead) return;
    p.dead = true;
    p.deathTimer = 1.4;
    p.vy = -290;
    p.vx = 0;
    this.lives = Math.max(0, this.lives - 1);
    retroAudio.playLoseLife();
    this.emitHud();
  }

  private updateEnemies(dt: number): void {
    const p = this.player;

    for (const e of this.level.enemies) {
      if (!e.alive) {
        if (e.squashedTimer > 0) e.squashedTimer -= dt;
        continue;
      }

      // Skip far off-screen enemies
      if (Math.abs(e.x - this.camX - SCREEN_W / 2) > SCREEN_W) continue;

      if (e.kind === 'piranha') {
        e.phase += dt * 2.2;
        e.y = e.homeY + Math.sin(e.phase) * 14;
      } else if (e.kind === 'bat') {
        e.phase += dt * 3.5;
        e.x += e.vx * dt;
        e.y = e.homeY + Math.sin(e.phase) * 16;
        if (e.x < this.camX - 40) e.vx = Math.abs(e.vx);
      } else if (e.kind === 'lava_pod') {
        e.vy += 520 * dt;
        e.y += e.vy * dt;
        if (e.y > e.homeY) {
          e.y = e.homeY;
          e.vy = -290;
        }
      } else if (e.kind === 'cannon_bullet') {
        e.x += e.vx * dt;
        if (e.x < this.camX - 60) {
          e.alive = false;
        }
      } else {
        // Ground patrol (goomba, koopa, spiny)
        e.vy = Math.min(400, e.vy + 980 * dt);
        e.x += e.vx * dt;

        const leftTx = Math.floor(e.x / TILE);
        const rightTx = Math.floor((e.x + e.w) / TILE);
        const midTy = Math.floor((e.y + e.h / 2) / TILE);
        if (e.vx > 0 && isSolidTile(this.getTile(rightTx, midTy))) {
          e.x = rightTx * TILE - e.w;
          e.vx = -Math.abs(e.vx);
          e.facing = -1;
        } else if (e.vx < 0 && isSolidTile(this.getTile(leftTx, midTy))) {
          e.x = (leftTx + 1) * TILE;
          e.vx = Math.abs(e.vx);
          e.facing = 1;
        }

        e.y += e.vy * dt;
        const botTy = Math.floor((e.y + e.h) / TILE);
        const cLeft = Math.floor((e.x + 2) / TILE);
        const cRight = Math.floor((e.x + e.w - 2) / TILE);
        if (e.vy >= 0 && (isSolidTile(this.getTile(cLeft, botTy)) || isSolidTile(this.getTile(cRight, botTy)))) {
          e.y = botTy * TILE - e.h;
          e.vy = 0;
        }
        if (e.y > SCREEN_H + 30) {
          e.alive = false;
        }
      }

      // Shell hitting other enemies
      if (e.kind === 'koopa' && e.shellMode && e.shellMoving) {
        for (const other of this.level.enemies) {
          if (other.id !== e.id && other.alive && aabb(e.x, e.y, e.w, e.h, other.x, other.y, other.w, other.h)) {
            other.alive = false;
            other.squashedTimer = 0.2;
            this.addScore(300, other.x, other.y - 6, '+300');
            retroAudio.playKick();
          }
        }
      }

      // Player collision
      if (!p.dead && aabb(p.x + 1, p.y + 1, p.w - 2, p.h - 2, e.x + 1, e.y + 1, e.w - 2, e.h - 2)) {
        if (p.starTimer > 0) {
          e.alive = false;
          this.spawnParticles(e.x + 8, e.y + 8, '#FBD000', 8, 120);
          this.addScore(300, e.x, e.y - 6, '+300');
          retroAudio.playKick();
          continue;
        }

        const stomp =
          p.vy > 0 &&
          p.y + p.h - p.vy * dt <= e.y + 8 &&
          e.kind !== 'spiny' &&
          e.kind !== 'piranha' &&
          e.kind !== 'lava_pod';

        if (stomp) {
          p.vy = -290;
          if (e.kind === 'koopa' && !e.shellMode) {
            e.shellMode = true;
            e.shellMoving = false;
            e.vx = 0;
            e.h = 14;
            e.y += 6;
            this.addScore(150, e.x, e.y - 6, '+150');
            retroAudio.playStomp();
          } else if (e.kind === 'koopa' && e.shellMode && !e.shellMoving) {
            e.shellMoving = true;
            e.vx = (p.x < e.x ? 1 : -1) * 195;
            this.addScore(200, e.x, e.y - 6, '+200');
            retroAudio.playKick();
          } else {
            e.alive = false;
            e.squashedTimer = 0.3;
            this.addScore(200, e.x, e.y - 6, '+200');
            retroAudio.playStomp();
          }
        } else if (e.kind === 'koopa' && e.shellMode && !e.shellMoving) {
          e.shellMoving = true;
          e.vx = (p.x < e.x ? 1 : -1) * 195;
          retroAudio.playKick();
        } else {
          this.damagePlayer();
        }
      }
    }
  }

  private updateBoss(dt: number): void {
    const b = this.level.boss;
    if (!b.active || b.defeated) return;

    if (b.invulnTimer > 0) b.invulnTimer = Math.max(0, b.invulnTimer - dt);
    b.actionTimer -= dt;
    b.phaseAngle += dt * 3;

    const p = this.player;
    b.facing = p.x < b.x ? -1 : 1;

    // Boss movement per archetype
    const isFlying = b.kind === 'thunder_falcon' || b.kind === 'phantom_warden' || b.kind === 'magma_dragon';

    if (isFlying) {
      const targetY = 72 + Math.sin(b.phaseAngle) * 42;
      b.y += (targetY - b.y) * Math.min(1, dt * 3.5);
      b.x += b.vx * dt;
      if (b.x <= b.arenaLeft + 8) b.vx = Math.abs(b.vx) || 65;
      if (b.x + b.w >= b.arenaRight - 8) b.vx = -(Math.abs(b.vx) || 65);
    } else {
      b.vy = Math.min(440, b.vy + 960 * dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y + b.h >= b.floorY) {
        b.y = b.floorY - b.h;
        b.vy = 0;
      }
      if (b.x <= b.arenaLeft) {
        b.x = b.arenaLeft;
        b.vx = Math.abs(b.vx) || 55;
      }
      if (b.x + b.w >= b.arenaRight) {
        b.x = b.arenaRight - b.w;
        b.vx = -(Math.abs(b.vx) || 55);
      }
    }

    // Periodic boss attacks scaling with stage
    if (b.actionTimer <= 0) {
      b.actionTimer = Math.max(0.75, 1.8 - this.stage * 0.09);
      const speedScale = 1 + this.stage * 0.08;

      if (!isFlying && Math.random() < 0.5) {
        // Boss jump / charge toward DARIO
        b.vy = -310;
        b.vx = b.facing * (70 * speedScale);
      } else {
        // Fire boss projectile
        const projKind =
          b.kind === 'crystal_yeti'
            ? 'ice_boulder'
            : b.kind === 'cannon_mech'
            ? 'cannonball'
            : b.kind === 'supreme_koopa_king'
            ? 'hammer'
            : 'enemy_orb';

        this.projectiles.push({
          id: this.nextEntityId++,
          fromPlayer: false,
          kind: projKind,
          x: b.x + (b.facing === 1 ? b.w : -8),
          y: b.y + b.h * 0.4,
          vx: b.facing * (120 + this.stage * 8),
          vy: projKind === 'hammer' ? -220 : isFlying ? 75 : -40,
          w: 10,
          h: 10,
          bounces: 0,
          alive: true,
          life: 3.2,
        });
      }
    }

    // Player vs Boss collision
    if (!p.dead && aabb(p.x + 1, p.y + 1, p.w - 2, p.h - 2, b.x + 2, b.y + 2, b.w - 4, b.h - 4)) {
      const stomp = p.vy > 0 && p.y + p.h - p.vy * dt <= b.y + 14;
      if (stomp || p.starTimer > 0) {
        p.vy = -320;
        this.hitBoss(1);
      } else {
        this.damagePlayer();
      }
    }
  }

  private hitBoss(dmg: number): void {
    const b = this.level.boss;
    if (b.defeated || b.invulnTimer > 0) return;
    b.hp -= dmg;
    b.invulnTimer = 0.45;
    retroAudio.playBossHit();
    this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#FBD000', 10, 120);

    if (b.hp <= 0) {
      b.hp = 0;
      b.defeated = true;
      const bonus = 2000 + this.stage * 500;
      this.addScore(bonus, b.x, b.y - 12, `CHEFÃO DERROTADO! +${bonus}`, '#FBD000');
      retroAudio.playBossDefeat();
      this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#F83800', 24, 180);
      this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#FBD000', 20, 150);

      // Clear enemy projectiles & open right Boss Gate
      for (const pr of this.projectiles) {
        if (!pr.fromPlayer) pr.alive = false;
      }
      const gateTx = this.level.widthTiles - 7;
      for (let gy = 5; gy <= 12; gy++) {
        if (this.level.tiles[gy][gateTx] === 12) {
          this.level.tiles[gy][gateTx] = 0;
          this.spawnParticles(gateTx * TILE + 8, gy * TILE + 8, '#A0A0B0', 4, 80);
        }
      }
      this.resumeStageMusic();
    }
    this.emitHud();
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (!pr.alive) continue;
      pr.life -= dt;
      if (pr.life <= 0) {
        pr.alive = false;
        continue;
      }

      if (pr.kind === 'fireball' || pr.kind === 'hammer' || pr.kind === 'ice_boulder') {
        pr.vy = Math.min(420, pr.vy + 780 * dt);
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // Tile collision
      const midTx = Math.floor((pr.x + pr.w / 2) / TILE);
      const midTy = Math.floor((pr.y + pr.h / 2) / TILE);
      const botTy = Math.floor((pr.y + pr.h) / TILE);

      if (pr.kind === 'fireball' && isSolidTile(this.getTile(midTx, botTy)) && pr.vy > 0) {
        pr.y = botTy * TILE - pr.h;
        pr.vy = -210;
        pr.bounces++;
        if (pr.bounces > 5) pr.alive = false;
      } else if (isSolidTile(this.getTile(midTx, midTy))) {
        pr.alive = false;
        this.spawnParticles(pr.x, pr.y, '#F87800', 4, 60);
        continue;
      }

      if (pr.fromPlayer) {
        // Hit enemies
        for (const e of this.level.enemies) {
          if (e.alive && aabb(pr.x, pr.y, pr.w, pr.h, e.x, e.y, e.w, e.h)) {
            pr.alive = false;
            e.alive = false;
            this.spawnParticles(e.x + 8, e.y + 8, '#F87800', 8, 100);
            this.addScore(250, e.x, e.y - 6, '+250');
            retroAudio.playKick();
            break;
          }
        }
        // Hit Boss
        const b = this.level.boss;
        if (pr.alive && b.active && !b.defeated && aabb(pr.x, pr.y, pr.w, pr.h, b.x, b.y, b.w, b.h)) {
          pr.alive = false;
          this.hitBoss(1);
        }
      } else {
        // Enemy projectile hitting DARIO
        if (!p.dead && p.starTimer <= 0 && p.invulnTimer <= 0 && aabb(pr.x, pr.y, pr.w, pr.h, p.x + 2, p.y + 2, p.w - 4, p.h - 4)) {
          pr.alive = false;
          this.damagePlayer();
        }
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.alive);
  }

  private updateParticles(dt: number): void {
    for (const pt of this.particles) {
      pt.life -= dt;
      if (pt.gravity) pt.vy += 420 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= 24 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;

    drawBackgroundScenery(ctx, this.level.biome, this.level.skyColor, this.camX, this.tick);

    // Draw visible tiles
    const startCol = Math.max(0, Math.floor(this.camX / TILE) - 1);
    const endCol = Math.min(this.level.widthTiles - 1, Math.ceil((this.camX + SCREEN_W) / TILE) + 1);

    for (let ty = 0; ty < this.level.heightTiles; ty++) {
      for (let tx = startCol; tx <= endCol; tx++) {
        const t = this.level.tiles[ty][tx];
        if (t !== 0) {
          const qb = this.level.questionBlocks[`${tx},${ty}`];
          drawTile(ctx, t, tx * TILE - this.camX, ty * TILE, this.level.biome, this.tick, qb?.bounceY ?? 0);
        }
      }
    }

    for (const mp of this.level.movingPlatforms) {
      drawMovingPlatform(ctx, mp, this.camX);
    }

    for (const sp of this.level.springs) {
      drawSpring(ctx, sp, this.camX);
    }

    for (const fb of this.level.fireBars) {
      drawFireBar(ctx, fb, this.camX, this.tick);
    }

    for (const c of this.level.coins) {
      drawCoin(ctx, c, this.camX, this.tick);
    }

    for (const pu of this.powerUps) {
      drawPowerUp(ctx, pu, this.camX, this.tick);
    }

    drawGoalFlag(
      ctx,
      this.level.goalX,
      this.level.goalY,
      this.camX,
      this.level.hasPrincess,
      this.tick,
      this.level.boss.defeated
    );

    for (const e of this.level.enemies) {
      drawEnemy(ctx, e, this.camX, this.tick);
    }

    drawBoss(ctx, this.level.boss, this.camX, this.tick);
    drawPlayer(ctx, this.player, this.camX, this.tick);

    for (const pr of this.projectiles) {
      drawProjectile(ctx, pr, this.camX, this.tick);
    }

    drawParticles(ctx, this.particles, this.camX);

    // Floating score / 1-UP texts
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const sx = Math.floor(ft.x - this.camX + 8);
      const sy = Math.floor(ft.y);
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, sx + 1, sy + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
    }
  }
}
