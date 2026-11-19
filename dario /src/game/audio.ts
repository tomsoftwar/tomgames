type MusicMode = 'none' | 'overworld' | 'underground' | 'boss' | 'star';

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private musicMode: MusicMode = 'none';
  private musicTimer: number | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.02);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.25,
    delay = 0,
    endFreq?: number
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, volume = 0.2, highpass = 800, delay = 0): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpass, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  public playJump(isBig = false): void {
    this.playTone(isBig ? 220 : 300, 0.14, 'square', 0.2, 0, isBig ? 560 : 720);
  }

  public playCoin(): void {
    this.playTone(987.77, 0.07, 'square', 0.22, 0);
    this.playTone(1318.51, 0.22, 'square', 0.22, 0.065);
  }

  public playBump(): void {
    this.playTone(150, 0.08, 'triangle', 0.28, 0, 80);
  }

  public playBrickBreak(): void {
    this.playNoise(0.14, 0.28, 400, 0);
    this.playTone(190, 0.09, 'square', 0.16, 0, 75);
  }

  public playPowerUpAppear(): void {
    const notes = [330, 392, 494, 587, 659];
    notes.forEach((n, idx) => this.playTone(n, 0.06, 'square', 0.16, idx * 0.045));
  }

  public playPowerUpCollect(): void {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((n, idx) => this.playTone(n, 0.08, 'square', 0.2, idx * 0.055));
  }

  public playOneUp(): void {
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((n, idx) => this.playTone(n, 0.09, 'square', 0.24, idx * 0.075));
  }

  public playStomp(): void {
    this.playTone(340, 0.09, 'square', 0.22, 0, 120);
    this.playNoise(0.06, 0.12, 1200, 0);
  }

  public playKick(): void {
    this.playTone(480, 0.09, 'triangle', 0.28, 0, 180);
  }

  public playFireball(): void {
    this.playTone(680, 0.08, 'square', 0.18, 0, 220);
  }

  public playSpring(): void {
    this.playTone(240, 0.22, 'square', 0.22, 0, 920);
  }

  public playHurt(): void {
    const notes = [440, 349, 293, 220];
    notes.forEach((n, idx) => this.playTone(n, 0.08, 'sawtooth', 0.2, idx * 0.05));
  }

  public playBossHit(): void {
    this.playNoise(0.12, 0.25, 300, 0);
    this.playTone(260, 0.14, 'sawtooth', 0.24, 0, 95);
  }

  public playBossDefeat(): void {
    for (let i = 0; i < 6; i++) {
      this.playNoise(0.16, 0.3, 250, i * 0.11);
      this.playTone(300 - i * 35, 0.14, 'square', 0.22, i * 0.11, 70);
    }
    const fanfare = [523, 659, 784, 1046];
    fanfare.forEach((n, idx) => this.playTone(n, 0.18, 'square', 0.24, 0.68 + idx * 0.1));
  }

  public playLoseLife(): void {
    this.stopMusic();
    const notes = [494, 466, 440, 392, 349, 330, 262];
    notes.forEach((n, idx) => this.playTone(n, 0.13, 'square', 0.22, idx * 0.1));
  }

  public playStageClear(): void {
    this.stopMusic();
    const melody = [392, 523, 659, 784, 659, 784, 1046];
    melody.forEach((n, idx) => {
      const dur = idx === melody.length - 1 ? 0.35 : 0.11;
      this.playTone(n, dur, 'square', 0.22, idx * 0.11);
    });
  }

  public playVictoryFanfare(): void {
    this.stopMusic();
    const notes = [
      523, 659, 784, 1046,
      784, 1046, 1318,
      1174, 1318, 1568,
    ];
    const times = [0, 0.12, 0.24, 0.36, 0.56, 0.68, 0.8, 1.05, 1.18, 1.32];
    notes.forEach((n, idx) => {
      const dur = idx === notes.length - 1 ? 0.55 : 0.14;
      this.playTone(n, dur, 'square', 0.24, times[idx]);
      this.playTone(n / 2, dur, 'triangle', 0.22, times[idx]);
    });
  }

  public playGameOver(): void {
    this.stopMusic();
    const notes = [392, 370, 349, 330, 262, 196];
    notes.forEach((n, idx) => {
      const dur = idx === notes.length - 1 ? 0.45 : 0.18;
      this.playTone(n, dur, 'square', 0.22, idx * 0.19);
      this.playTone(n / 2, dur, 'triangle', 0.2, idx * 0.19);
    });
  }

  public startMusic(mode: MusicMode): void {
    if (this.musicMode === mode && this.musicTimer !== null) return;
    this.stopMusic();
    this.musicMode = mode;
    if (mode === 'none') return;

    this.stepIndex = 0;
    const tempoMs = mode === 'boss' ? 125 : mode === 'star' ? 105 : mode === 'underground' ? 165 : 150;

    // Original NES-style adventure motifs
    const overworldLead = [
      659, 0, 659, 0, 784, 0, 659, 523,
      587, 659, 0, 523, 440, 0, 392, 0,
      523, 0, 392, 0, 330, 0, 440, 494,
      466, 440, 0, 392, 659, 784, 880, 0,
    ];
    const overworldBass = [
      131, 196, 131, 196, 165, 196, 165, 196,
      147, 220, 147, 220, 131, 196, 98, 147,
      131, 196, 98, 147, 82, 131, 110, 165,
      104, 110, 147, 196, 131, 165, 196, 147,
    ];

    const undergroundLead = [
      220, 440, 233, 466, 0, 0, 220, 440,
      262, 523, 233, 466, 0, 0, 196, 392,
      220, 0, 262, 294, 330, 0, 294, 262,
      220, 0, 196, 0, 165, 0, 196, 0,
    ];
    const undergroundBass = [
      110, 0, 117, 0, 110, 0, 110, 0,
      131, 0, 117, 0, 98, 0, 98, 0,
      110, 110, 131, 147, 165, 0, 147, 131,
      110, 0, 98, 0, 82, 0, 98, 0,
    ];

    const bossLead = [
      330, 330, 392, 440, 330, 0, 494, 440,
      392, 330, 294, 330, 262, 294, 330, 0,
      440, 440, 523, 587, 440, 0, 659, 587,
      523, 494, 440, 392, 349, 330, 294, 247,
    ];
    const bossBass = [
      82, 165, 82, 165, 82, 165, 98, 196,
      82, 165, 73, 147, 65, 73, 82, 123,
      110, 220, 110, 220, 110, 220, 131, 262,
      110, 98, 87, 82, 73, 65, 62, 55,
    ];

    const starLead = [
      523, 659, 784, 1046, 523, 659, 784, 1046,
      587, 698, 880, 1174, 587, 698, 880, 1174,
    ];
    const starBass = [
      131, 262, 196, 262, 131, 262, 196, 262,
      147, 294, 220, 294, 147, 294, 220, 294,
    ];

    const tick = () => {
      if (this.musicMode === 'none') return;
      if (!this.muted) {
        let lead = overworldLead;
        let bass = overworldBass;
        if (this.musicMode === 'underground') {
          lead = undergroundLead;
          bass = undergroundBass;
        } else if (this.musicMode === 'boss') {
          lead = bossLead;
          bass = bossBass;
        } else if (this.musicMode === 'star') {
          lead = starLead;
          bass = starBass;
        }

        const idx = this.stepIndex % lead.length;
        const lNote = lead[idx];
        const bNote = bass[idx];

        if (lNote > 0) {
          this.playTone(lNote, (tempoMs / 1000) * 0.85, 'square', 0.085);
        }
        if (bNote > 0) {
          this.playTone(bNote, (tempoMs / 1000) * 0.9, 'triangle', 0.12);
        }
        if (this.musicMode === 'boss' || idx % 2 === 1) {
          this.playNoise(0.03, 0.04, 2500);
        }
      }
      this.stepIndex++;
    };

    this.musicTimer = window.setInterval(tick, tempoMs);
  }

  public stopMusic(): void {
    this.musicMode = 'none';
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const retroAudio = new RetroAudioEngine();
