import {
  Crown,
  Gamepad2,
  Keyboard,
  Play,
  Smartphone,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { GamePopupModal } from './components/GamePopupModal';
import { GlobalRanking } from './components/GlobalRanking';
import { getStagePreviewList } from './game/levels';
import {
  drawBackgroundScenery,
  drawCoin,
  drawEnemy,
  drawPlayer,
  drawPrincess,
  drawTile,
  TILE,
} from './game/sprites';

function CartridgePreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const renderPreview = () => {
      tick++;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          drawBackgroundScenery(ctx, 'overworld', '#5C94FC', tick * 0.35, tick);

          // Ground tiles
          for (let tx = 0; tx < 25; tx++) {
            drawTile(ctx, 1, tx * TILE, 13 * TILE, 'overworld', tick);
            drawTile(ctx, 1, tx * TILE, 14 * TILE, 'overworld', tick);
          }

          // Floating NES blocks matching classic layout
          drawTile(ctx, 4, 5 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 2, 10 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 3, 11 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 2, 12 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 3, 13 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 2, 14 * TILE, 9 * TILE, 'overworld', tick);
          drawTile(ctx, 3, 12 * TILE, 5 * TILE, 'overworld', tick);

          // Pipe on right
          drawTile(ctx, 7, 19 * TILE, 11 * TILE, 'overworld', tick);
          drawTile(ctx, 7, 20 * TILE, 11 * TILE, 'overworld', tick);
          drawTile(ctx, 6, 19 * TILE, 12 * TILE, 'overworld', tick);
          drawTile(ctx, 6, 20 * TILE, 12 * TILE, 'overworld', tick);

          drawCoin(ctx, { id: 1, x: 11 * TILE + 2, y: 7 * TILE, collected: false, bobOffset: 0 }, 0, tick);
          drawCoin(ctx, { id: 2, x: 13 * TILE + 2, y: 7 * TILE, collected: false, bobOffset: 6 }, 0, tick);

          drawEnemy(
            ctx,
            {
              id: 3,
              kind: 'goomba',
              x: 10 * TILE + Math.sin(tick * 0.04) * 28,
              y: 12 * TILE,
              vx: -30,
              vy: 0,
              w: 16,
              h: 16,
              alive: true,
              squashedTimer: 0,
              homeY: 12 * TILE,
              phase: 0,
              facing: -1,
            },
            0,
            tick
          );

          const jumpY = Math.abs(Math.sin(tick * 0.06)) * 26;
          drawPlayer(
            ctx,
            {
              x: 5 * TILE + 1,
              y: 12 * TILE - 10 - jumpY,
              vx: 40,
              vy: 0,
              w: 14,
              h: 26,
              facing: 1,
              onGround: jumpY < 2,
              coyoteTimer: 0,
              jumpBufferTimer: 0,
              power: 'big',
              starTimer: 0,
              featherTimer: 0,
              invulnTimer: 0,
              fireCooldown: 0,
              walkFrame: Math.floor(tick / 6) % 3,
              walkTimer: 0,
              dead: false,
              deathTimer: 0,
              hasWonStage: false,
            },
            0,
            tick
          );

          drawPrincess(ctx, 19 * TILE + 8, 11 * TILE - 26, 0, tick);
        }
      }
      raf = requestAnimationFrame(renderPreview);
    };
    raf = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={240}
      className="w-full h-full object-cover pixelated block"
    />
  );
}

const POWER_UPS_INFO = [
  {
    name: 'Super Cogumelo',
    effect: 'Dario cresce, ganha resistência a 1 golpe e quebra blocos de tijolo.',
  },
  {
    name: 'Flor de Fogo',
    effect: 'Permite lançar bolas de fogo para derrotar inimigos e atingir chefões à distância.',
  },
  {
    name: 'Estrela Invencível',
    effect: 'Proteção arco-íris por 10 segundos com velocidade extra e derrota por contato.',
  },
  {
    name: 'Cogumelo 1-UP',
    effect: 'Concede +1 vida extra imediatamente (além da vida automática a cada 5.000 pontos).',
  },
  {
    name: 'Asas Turbo',
    effect: 'Pulo mais alto e queda suave por 15 segundos para atravessar abismos difíceis.',
  },
];

export default function App() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [rankingRefresh, setRankingRefresh] = useState(0);
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);

  const stages = getStagePreviewList();

  const handleScoreSubmitted = (entryId: string) => {
    setHighlightEntryId(entryId);
    setRankingRefresh((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-[#F3F4F6]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-4">
          <a
            href="#inicio"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            TomGames
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#inicio" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Início
            </a>
            <a href="#fases" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              10 Fases
            </a>
            <a href="#controles" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Controles
            </a>
            <a href="#ranking" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Ranking Global
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#E52521] hover:bg-[#c81d1a] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Jogar Agora
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero / Featured TomGames Cartridge */}
        <section id="inicio" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#FBD000] mb-3">
                Catálogo Oficial · www.tomgames.com.br
              </p>
              <h1 className="font-pixel text-2xl sm:text-4xl text-white leading-snug mb-4 [text-wrap:balance]">
                DARIO ADVENTURE
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                Clássico de plataforma 8-bits inspirado na era de ouro do NES. Atravesse 10 fases com dificuldade crescente, derrote o chefão de cada mundo, colete moedas e poderes e salve a Princesa Clarice.
              </p>

              <div className="grid grid-cols-3 gap-4 py-4 px-4 mb-6 rounded-xl border border-white/10 bg-[#121824]">
                <div>
                  <div className="text-xs text-slate-400">Vidas Iniciais</div>
                  <div className="text-base sm:text-lg font-bold text-white font-mono-tabular">4 Vidas</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Vida Bônus</div>
                  <div className="text-base sm:text-lg font-bold text-[#FBD000] font-mono-tabular">5.000 pts</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Campanha</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono-tabular">10 Fases</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPopupOpen(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#E52521] hover:bg-[#c81d1a] text-white font-bold text-sm rounded-xl border-b-4 border-[#90100E] transition-all whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Abrir Jogo em Janela Popup
                </button>
                <a
                  href="#ranking"
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-sm rounded-xl border border-white/10 transition-colors whitespace-nowrap"
                >
                  Ver Ranking Global
                </a>
              </div>
            </div>

            {/* Clickable Game Launcher Card */}
            <div className="lg:col-span-6 flex">
              <button
                type="button"
                onClick={() => setPopupOpen(true)}
                className="group relative w-full text-left rounded-2xl border border-white/15 bg-[#121824] overflow-hidden shadow-2xl hover:border-[#FBD000]/70 transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[5/3] w-full bg-[#5C94FC] overflow-hidden">
                  <CartridgePreviewCanvas />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-black/85 border-2 border-[#FBD000] text-white font-pixel text-xs group-hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 fill-[#FBD000] text-[#FBD000]" />
                      CLIQUE PARA JOGAR
                    </div>
                  </div>
                </div>

                <div className="p-5 flex items-center justify-between gap-4 border-t border-white/10">
                  <div>
                    <div className="font-bold text-white text-base">
                      DARIO Adventure (Edição Arcade)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Plataforma 8-Bits · PC e Celular · Efeitos Sonoros NES
                    </div>
                  </div>
                  <Gamepad2 className="w-6 h-6 text-[#FBD000] shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 10 Progressive Stages & Bosses */}
        <section id="fases" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-white/10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              10 Fases Progressivas e Chefões
            </h2>
            <p className="text-sm text-slate-400">
              Cada fase apresenta novos obstáculos, armadilhas e um chefão exclusivo no final da arena.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stages.map((st) => (
              <button
                key={st.stage}
                type="button"
                onClick={() => setPopupOpen(true)}
                className="text-left p-4 rounded-xl border border-white/10 bg-[#121824] hover:border-[#FBD000]/50 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono-tabular font-bold text-[#FBD000]">
                      Fase {String(st.stage).padStart(2, '0')}
                    </span>
                    {st.stage === 10 && <Crown className="w-4 h-4 text-[#FBD000]" />}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{st.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{st.subtitle}</p>
                </div>
                <div className="pt-2.5 border-t border-white/10 text-[11px] text-slate-300">
                  Chefão: <span className="font-semibold text-white">{st.bossName}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Power-ups & Cross-device Controls */}
        <section id="controles" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2.5 mb-4">
                <Sparkles className="w-5 h-5 text-[#FBD000]" />
                <h2 className="text-xl font-bold text-white">Poderes Especiais</h2>
              </div>
              <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#121824]">
                {POWER_UPS_INFO.map((pw) => (
                  <div key={pw.name} className="p-4">
                    <div className="text-sm font-bold text-white">{pw.name}</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pw.effect}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 rounded-xl border border-white/10 bg-[#121824]">
                <div className="flex items-center gap-2.5 mb-3">
                  <Keyboard className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Controles no Computador</h3>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Mover Dario</span>
                    <span className="font-mono-tabular font-semibold text-white">Setas ou A / D</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Pular (segure para pular alto)</span>
                    <span className="font-mono-tabular font-semibold text-white">Espaço, W, Seta ↑ ou Z</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Correr / Bola de Fogo</span>
                    <span className="font-mono-tabular font-semibold text-white">X, Shift ou F</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Pausar</span>
                    <span className="font-mono-tabular font-semibold text-white">P ou Esc</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#121824]">
                <div className="flex items-center gap-2.5 mb-3">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Celular e Tablet</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Ao abrir em dispositivos móveis ou tablets, o controle virtual multi-toque aparece automaticamente na tela com setas direcionais à esquerda e botões A (Pular) e B (Fogo/Correr) à direita.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#121824]">
                <div className="flex items-center gap-2.5 mb-2">
                  <Volume2 className="w-5 h-5 text-[#FBD000]" />
                  <h3 className="text-base font-bold text-white">Trilha e Efeitos 8-Bits</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sintetizador chiptune integrado estilo NES com músicas de exploração, cavernas, batalha contra chefões e efeitos retrô para cada ação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Ranking Section */}
        <section id="ranking" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-white/10">
          <GlobalRanking
            refreshTrigger={rankingRefresh}
            highlightId={highlightEntryId}
          />
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        www.tomgames.com.br · DARIO Adventure · Todos os direitos reservados
      </footer>

      <GamePopupModal
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onScoreSubmitted={handleScoreSubmitted}
        rankingRefresh={rankingRefresh}
        highlightEntryId={highlightEntryId}
      />
    </div>
  );
}
