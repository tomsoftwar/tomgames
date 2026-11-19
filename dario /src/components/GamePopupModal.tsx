import {
  Gamepad2,
  Maximize2,
  Minimize2,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { retroAudio } from '../game/audio';
import type { DarioGameEngine } from '../game/engine';
import { GameCanvas } from './GameCanvas';
import { GlobalRanking } from './GlobalRanking';

interface GamePopupModalProps {
  open: boolean;
  onClose: () => void;
  onScoreSubmitted: (entryId: string) => void;
  rankingRefresh: number;
  highlightEntryId: string | null;
}

export function GamePopupModal({
  open,
  onClose,
  onScoreSubmitted,
  rankingRefresh,
  highlightEntryId,
}: GamePopupModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<DarioGameEngine | null>(null);

  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRankingDrawer, setShowRankingDrawer] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      window.innerWidth < 900
    );
  });

  useEffect(() => {
    if (!open) {
      retroAudio.stopMusic();
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRankingDrawer) {
          setShowRankingDrawer(false);
        } else {
          engineRef.current?.togglePause();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, showRankingDrawer]);

  const handleClose = useCallback(() => {
    retroAudio.stopMusic();
    onClose();
  }, [onClose]);

  const handleToggleFullscreen = () => {
    const el = modalRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        void el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      void document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Janela do jogo DARIO Adventure"
    >
      <div
        ref={modalRef}
        className={`relative flex flex-col bg-[#0D131F] border border-white/15 shadow-2xl overflow-hidden transition-all ${
          isFullscreen
            ? 'w-screen h-screen rounded-none'
            : 'w-full h-full sm:w-[96vw] sm:max-w-5xl sm:h-[90vh] sm:max-h-[820px] sm:rounded-xl'
        }`}
      >
        {/* TomGames Popup Titlebar */}
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-[#151C2C] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-pixel text-[10px] sm:text-xs text-[#FBD000] truncate">
              DARIO ADVENTURE
            </span>
            <span className="hidden md:inline text-xs text-slate-400 whitespace-nowrap">
              · www.tomgames.com.br
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowRankingDrawer((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                showRankingDrawer
                  ? 'bg-[#FBD000] text-black'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
              title="Ranking Global"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ranking</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTouchControls((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                showTouchControls
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
              title="Mostrar/Ocultar Controles na Tela"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Controles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = engineRef.current ? engineRef.current.toggleMute() : retroAudio.toggleMute();
                setMuted(next);
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 cursor-pointer"
              aria-label={muted ? 'Ativar som' : 'Silenciar som'}
              title={muted ? 'Ativar som' : 'Silenciar som'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="hidden sm:inline-flex p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 cursor-pointer"
              aria-label="Alternar tela cheia"
              title="Alternar tela cheia"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-[#E52521]/80 hover:bg-[#E52521] text-white cursor-pointer"
              aria-label="Fechar janela do jogo"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Body + Optional Ranking Drawer */}
        <div className="relative flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 h-full">
            <GameCanvas
              showTouchControls={showTouchControls}
              onScoreSubmitted={onScoreSubmitted}
              onEngineReady={(eng) => {
                engineRef.current = eng;
              }}
            />
          </div>

          {showRankingDrawer && (
            <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-96 bg-[#0B0F17]/98 border-l border-white/15 p-4 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-white">Ranking Global TomGames</span>
                <button
                  type="button"
                  onClick={() => setShowRankingDrawer(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/15 rounded-md cursor-pointer"
                >
                  Voltar ao Jogo
                </button>
              </div>
              <GlobalRanking
                refreshTrigger={rankingRefresh}
                highlightId={highlightEntryId}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
