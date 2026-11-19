import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DarioGameEngine } from '../game/engine';
import { getStagePreviewList } from '../game/levels';
import { SCREEN_H, SCREEN_W } from '../game/sprites';
import type { HudSnapshot, InputState } from '../game/types';

interface GameCanvasProps {
  showTouchControls: boolean;
  onScoreSubmitted: (entryId: string) => void;
  onEngineReady?: (engine: DarioGameEngine) => void;
  onHudUpdate?: (hud: HudSnapshot) => void;
}

const INITIAL_HUD: HudSnapshot = {
  screen: 'TITLE_MENU',
  stage: 1,
  stageName: 'Planície do Reino',
  score: 0,
  coins: 0,
  lives: 4,
  nextLifeScore: 5000,
  timeLeft: 240,
  power: 'small',
  starActive: false,
  featherActive: false,
  bossActive: false,
  bossName: '',
  bossSubtitle: '',
  bossHp: 0,
  bossMaxHp: 1,
  princessSaved: false,
  muted: false,
};

export function GameCanvas({
  showTouchControls,
  onScoreSubmitted,
  onEngineReady,
  onHudUpdate,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<DarioGameEngine | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    fire: false,
    fireJustPressed: false,
  });

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedStartStage, setSelectedStartStage] = useState(1);

  const dpadPointerRef = useRef<number | null>(null);
  const dpadZoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const engine = new DarioGameEngine((snapshot) => {
      setHud(snapshot);
      onHudUpdate?.(snapshot);
    });
    engineRef.current = engine;
    onEngineReady?.(engine);

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      engine.update(dt, inputRef.current);
      inputRef.current.jumpJustPressed = false;
      inputRef.current.fireJustPressed = false;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          engine.render(ctx);
        }
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [onEngineReady, onHudUpdate]);

  // Keyboard listeners
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const code = e.code;

      if (code === 'ArrowLeft' || code === 'KeyA') {
        e.preventDefault();
        inputRef.current.left = true;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        e.preventDefault();
        inputRef.current.right = true;
      } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space' || code === 'KeyZ') {
        e.preventDefault();
        if (!inputRef.current.jump) {
          inputRef.current.jumpJustPressed = true;
        }
        inputRef.current.jump = true;
      } else if (
        code === 'KeyX' ||
        code === 'KeyF' ||
        code === 'KeyJ' ||
        code === 'KeyK' ||
        code === 'ShiftLeft' ||
        code === 'ShiftRight'
      ) {
        e.preventDefault();
        if (!inputRef.current.fire) {
          inputRef.current.fireJustPressed = true;
        }
        inputRef.current.fire = true;
      } else if (code === 'KeyP') {
        e.preventDefault();
        engineRef.current?.togglePause();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        inputRef.current.left = false;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        inputRef.current.right = false;
      } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space' || code === 'KeyZ') {
        inputRef.current.jump = false;
      } else if (
        code === 'KeyX' ||
        code === 'KeyF' ||
        code === 'KeyJ' ||
        code === 'KeyK' ||
        code === 'ShiftLeft' ||
        code === 'ShiftRight'
      ) {
        inputRef.current.fire = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleStartGame = useCallback((stageNum = selectedStartStage) => {
    setSubmittedRank(null);
    setSubmitError(null);
    engineRef.current?.startNewGame(stageNum);
  }, [selectedStartStage]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = playerName.trim();
    if (clean.length < 2) {
      setSubmitError('Digite pelo menos 2 caracteres.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: clean,
          score: hud.score,
          coins: hud.coins,
          stageReached: hud.stage,
          savedPrincess: hud.princessSaved,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        rank?: number | null;
        entry?: { id: string };
      };
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar pontuação.');
      }
      setSubmittedRank(data.rank ?? null);
      if (data.entry?.id) {
        onScoreSubmitted(data.entry.id);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar pontuação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-touch D-Pad swipe helper
  const updateDpadFromClientX = (clientX: number) => {
    const zone = dpadZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const relX = clientX - rect.left;
    const mid = rect.width / 2;
    if (relX < mid - 4) {
      inputRef.current.left = true;
      inputRef.current.right = false;
    } else if (relX > mid + 4) {
      inputRef.current.left = false;
      inputRef.current.right = true;
    }
  };

  const stagePreviews = getStagePreviewList();

  return (
    <div className="flex flex-col w-full h-full bg-[#090D14] select-none">
      {/* Classic NES-style Top HUD */}
      <div className="grid grid-cols-5 gap-2 px-3 sm:px-5 py-2.5 bg-black border-b border-white/10 font-pixel text-[9px] sm:text-[11px] leading-tight text-white">
        <div>
          <div className="text-slate-400 text-[7px] sm:text-[9px] mb-1">DARIO</div>
          <div className="font-mono-tabular tracking-wider">
            {String(hud.score).padStart(6, '0')}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-[7px] sm:text-[9px] mb-1">MOEDAS</div>
          <div className="text-[#FBD000] font-mono-tabular">
            {String(hud.coins).padStart(3, '0')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 text-[7px] sm:text-[9px] mb-1">FASE</div>
          <div className="text-white">{hud.stage} / 10</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 text-[7px] sm:text-[9px] mb-1">VIDAS</div>
          <div className="inline-flex items-center justify-center gap-1 text-emerald-400">
            <Heart className="w-3 h-3 fill-emerald-400 shrink-0" />
            <span>x{hud.lives}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-[7px] sm:text-[9px] mb-1">TEMPO</div>
          <div className={`font-mono-tabular ${hud.timeLeft <= 30 ? 'text-rose-400' : 'text-white'}`}>
            {String(hud.timeLeft).padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Sub-HUD Status Strip: Active Power-Up + Next 1-UP */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 bg-[#101622] border-b border-white/10 text-[11px] text-slate-300">
        <div className="flex items-center gap-3 truncate">
          <span className="font-semibold text-white truncate">{hud.stageName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="inline-flex items-center gap-1 text-xs">
            {hud.power === 'fire' ? (
              <span className="text-orange-400 font-semibold inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Fogo
              </span>
            ) : hud.power === 'big' ? (
              <span className="text-rose-400 font-semibold">Super Dario</span>
            ) : (
              <span className="text-slate-400">Normal</span>
            )}
            {hud.starActive && (
              <span className="text-yellow-300 font-semibold ml-1 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Estrela
              </span>
            )}
            {hud.featherActive && (
              <span className="text-sky-400 font-semibold ml-1">Asas</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs text-slate-400 font-mono-tabular">
            +1 Vida aos {hud.nextLifeScore.toLocaleString('pt-BR')} pts
          </span>
          {(hud.screen === 'PLAYING' || hud.screen === 'PAUSED') && (
            <button
              type="button"
              onClick={() => engineRef.current?.togglePause()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
            >
              {hud.screen === 'PAUSED' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {hud.screen === 'PAUSED' ? 'Continuar' : 'Pausar'}
            </button>
          )}
        </div>
      </div>

      {/* Main Game Viewport */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden min-h-[240px]">
        <canvas
          ref={canvasRef}
          width={SCREEN_W}
          height={SCREEN_H}
          className="w-full h-full max-h-full object-contain pixelated"
        />

        {/* Boss Health Bar Overlay */}
        {hud.bossActive && hud.screen === 'PLAYING' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(90%,340px)] bg-black/80 border-2 border-[#FBD000] rounded px-3 py-2 pointer-events-none">
            <div className="flex items-center justify-between font-pixel text-[8px] sm:text-[9px] text-[#FBD000] mb-1.5">
              <span className="truncate">{hud.bossName.toUpperCase()}</span>
              <span className="ml-2 font-mono-tabular">
                {hud.bossHp}/{hud.bossMaxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 border border-white/20 overflow-hidden">
              <div
                className="h-full bg-[#E52521] transition-all duration-150"
                style={{ width: `${Math.max(0, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* TITLE MENU OVERLAY */}
        {hud.screen === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-black/78 flex flex-col items-center justify-center p-4 text-center overflow-y-auto">
            <div className="max-w-md w-full bg-[#111827]/95 border-2 border-[#FBD000] rounded-xl p-5 sm:p-6 shadow-2xl">
              <p className="text-[11px] font-semibold text-[#FBD000] tracking-wide mb-2">
                www.tomgames.com.br
              </p>
              <h2 className="font-pixel text-lg sm:text-2xl text-white leading-relaxed mb-2">
                DARIO ADVENTURE
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                Enfrente 10 fases cheias de obstáculos, colete moedas e poderes, derrote o chefão de cada fase e resgate a Princesa Clarice.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center py-2.5 px-3 mb-4 rounded-lg bg-black/50 border border-white/10 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Vidas Iniciais</div>
                  <div className="font-bold text-emerald-400">4 Vidas</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Vida Extra</div>
                  <div className="font-bold text-[#FBD000]">5.000 pts</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Campanha</div>
                  <div className="font-bold text-white">10 Fases</div>
                </div>
              </div>

              <div className="mb-4 text-left">
                <label
                  htmlFor="stage-select"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Fase Inicial
                </label>
                <select
                  id="stage-select"
                  value={selectedStartStage}
                  onChange={(e) => setSelectedStartStage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-medium bg-[#0B0F17] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#FBD000]"
                >
                  {stagePreviews.map((sp) => (
                    <option key={sp.stage} value={sp.stage}>
                      Fase {sp.stage}: {sp.name} (Chefão: {sp.bossName})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleStartGame(selectedStartStage)}
                className="w-full py-3.5 px-6 bg-[#E52521] hover:bg-[#c81d1a] active:translate-y-0.5 text-white font-pixel text-xs sm:text-sm rounded-lg border-b-4 border-[#90100E] transition-all cursor-pointer"
              >
                INICIAR AVENTURA
              </button>

              <p className="text-[11px] text-slate-400 mt-3">
                PC: Setas / WASD para mover, Espaço/Z para pular, X/Shift para Fogo/Correr
              </p>
            </div>
          </div>
        )}

        {/* STAGE INTRO OVERLAY */}
        {hud.screen === 'STAGE_INTRO' && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center">
            <p className="font-pixel text-xs text-[#FBD000] mb-3">
              FASE {hud.stage} DE 10
            </p>
            <h3 className="font-pixel text-base sm:text-xl text-white mb-4">
              {hud.stageName.toUpperCase()}
            </h3>
            <div className="flex items-center gap-2 font-pixel text-xs text-emerald-400">
              <Heart className="w-4 h-4 fill-emerald-400" />
              <span>DARIO x {hud.lives}</span>
            </div>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {hud.screen === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#121824] border-2 border-white/20 rounded-xl p-6 max-w-xs w-full text-center">
              <h3 className="font-pixel text-base text-white mb-4">JOGO PAUSADO</h3>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => engineRef.current?.togglePause()}
                  className="w-full py-2.5 px-4 bg-[#E52521] hover:bg-[#c81d1a] text-white text-sm font-bold rounded-lg cursor-pointer"
                >
                  Continuar Jogo
                </button>
                <button
                  type="button"
                  onClick={() => handleStartGame(1)}
                  className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Reiniciar da Fase 1
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE CLEAR OVERLAY */}
        {hud.screen === 'STAGE_CLEAR' && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center p-4">
            <div className="bg-[#121824] border-2 border-[#4ADE80] rounded-xl px-6 py-5 text-center">
              <p className="font-pixel text-xs text-[#4ADE80] mb-2">FASE {hud.stage} CONCLUÍDA!</p>
              <p className="text-sm text-white font-semibold">
                Preparando Fase {hud.stage + 1}...
              </p>
            </div>
          </div>
        )}

        {/* GAME OVER / VICTORY OVERLAY + GLOBAL RANKING SUBMISSION */}
        {(hud.screen === 'GAME_OVER' || hud.screen === 'VICTORY') && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-md w-full bg-[#121824] border-2 border-[#FBD000] rounded-xl p-5 sm:p-6 text-center shadow-2xl">
              {hud.screen === 'VICTORY' ? (
                <>
                  <Trophy className="w-10 h-10 text-[#FBD000] mx-auto mb-2" />
                  <h3 className="font-pixel text-base sm:text-lg text-[#FBD000] mb-2">
                    PRINCESA SALVA!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mb-4">
                    Parabéns! DARIO derrotou o Rei Casco Supremo na Fase 10 e resgatou a Princesa Clarice!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-pixel text-lg text-[#E52521] mb-2">FIM DE JOGO</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mb-4">
                    DARIO chegou até a Fase {hud.stage} de 10.
                  </p>
                </>
              )}

              <div className="grid grid-cols-3 gap-2 py-3 px-3 mb-4 rounded-lg bg-black/50 border border-white/10">
                <div>
                  <div className="text-[11px] text-slate-400">Pontuação</div>
                  <div className="font-mono-tabular font-bold text-white text-sm">
                    {hud.score.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Moedas</div>
                  <div className="font-mono-tabular font-bold text-[#FBD000] text-sm">
                    {hud.coins}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Fase</div>
                  <div className="font-mono-tabular font-bold text-emerald-400 text-sm">
                    {hud.stage}/10
                  </div>
                </div>
              </div>

              {submittedRank !== null ? (
                <div className="p-3 mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold">
                  Pontuação salva no Ranking Global! Posição atual: {submittedRank}º lugar.
                </div>
              ) : (
                <form onSubmit={handleSubmitScore} className="mb-4 text-left">
                  <label
                    htmlFor="ranking-name"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Salvar no Ranking Global
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="ranking-name"
                      type="text"
                      maxLength={16}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Seu apelido (ex: DARIO_BR)"
                      className="flex-1 px-3 py-2 text-sm bg-[#0B0F17] text-white border border-white/15 rounded-lg focus:outline-none focus:border-[#FBD000]"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[#FBD000] hover:bg-[#e5be00] text-black text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? 'Salvando...' : 'Registrar'}
                    </button>
                  </div>
                  {submitError && (
                    <p className="text-xs text-rose-400 mt-1.5">{submitError}</p>
                  )}
                </form>
              )}

              <button
                type="button"
                onClick={() => handleStartGame(1)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#E52521] hover:bg-[#c81d1a] text-white font-pixel text-xs rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                JOGAR NOVAMENTE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Touch Controller for Mobile & Tablet */}
      {showTouchControls && (
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-[#111622] border-t border-white/10 touch-gamepad-btn">
          {/* Left / Right Directional Pad */}
          <div
            ref={dpadZoneRef}
            onPointerDown={(e) => {
              e.preventDefault();
              dpadPointerRef.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateDpadFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dpadPointerRef.current === e.pointerId) {
                updateDpadFromClientX(e.clientX);
              }
            }}
            onPointerUp={(e) => {
              if (dpadPointerRef.current === e.pointerId) {
                dpadPointerRef.current = null;
                inputRef.current.left = false;
                inputRef.current.right = false;
              }
            }}
            onPointerCancel={() => {
              dpadPointerRef.current = null;
              inputRef.current.left = false;
              inputRef.current.right = false;
            }}
            className="flex items-center gap-3 touch-gamepad-btn"
          >
            <button
              type="button"
              aria-label="Mover para Esquerda"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 active:bg-slate-600 border-2 border-white/20 flex items-center justify-center text-white shadow-inner touch-gamepad-btn"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              type="button"
              aria-label="Mover para Direita"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 active:bg-slate-600 border-2 border-white/20 flex items-center justify-center text-white shadow-inner touch-gamepad-btn"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Action Buttons: B (Fire/Run) & A (Jump) */}
          <div className="flex items-center gap-3 sm:gap-4 touch-gamepad-btn">
            <button
              type="button"
              aria-label="Correr ou Lançar Fogo"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                inputRef.current.fireJustPressed = true;
                inputRef.current.fire = true;
              }}
              onPointerUp={() => {
                inputRef.current.fire = false;
              }}
              onPointerCancel={() => {
                inputRef.current.fire = false;
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-600 active:bg-amber-400 border-2 border-amber-300/60 flex flex-col items-center justify-center text-white font-pixel text-[9px] shadow-lg touch-gamepad-btn"
            >
              <span className="text-xs font-bold">B</span>
              <span className="text-[7px] font-sans font-semibold mt-0.5">FOGO</span>
            </button>

            <button
              type="button"
              aria-label="Pular"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                inputRef.current.jumpJustPressed = true;
                inputRef.current.jump = true;
              }}
              onPointerUp={() => {
                inputRef.current.jump = false;
              }}
              onPointerCancel={() => {
                inputRef.current.jump = false;
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#E52521] active:bg-rose-400 border-2 border-rose-300/60 flex flex-col items-center justify-center text-white font-pixel text-[9px] shadow-lg touch-gamepad-btn"
            >
              <span className="text-sm font-bold">A</span>
              <span className="text-[7px] font-sans font-semibold mt-0.5">PULAR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
