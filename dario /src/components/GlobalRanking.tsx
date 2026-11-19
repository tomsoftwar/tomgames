import { Crown, RefreshCw, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { RankingEntry } from '../game/types';

interface GlobalRankingProps {
  refreshTrigger?: number;
  highlightId?: string | null;
  compact?: boolean;
}

export function GlobalRanking({
  refreshTrigger = 0,
  highlightId = null,
  compact = false,
}: GlobalRankingProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ranking');
      if (!res.ok) {
        throw new Error('Falha ao buscar ranking.');
      }
      const data = (await res.json()) as { entries?: RankingEntry[] };
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setError('Não foi possível carregar o ranking global no momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRanking();
  }, [loadRanking, refreshTrigger]);

  const displayed = compact ? entries.slice(0, 10) : entries.slice(0, 25);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#121824] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#FBD000] shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Ranking Global</h3>
            <p className="text-xs text-slate-400">
              Melhores pontuações registradas no TomGames
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadRanking()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && entries.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Carregando pontuações globais...
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-rose-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => void loadRanking()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#E52521] hover:bg-[#c91f1b] rounded-lg transition-colors cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">
            Nenhuma pontuação registrada ainda.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Seja o primeiro jogador a completar uma partida e entrar para o ranking global!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold text-slate-400 bg-white/[0.02]">
                <th className="py-3 pl-5 pr-3 w-12">#</th>
                <th className="py-3 px-3">Jogador</th>
                <th className="py-3 px-3">Progresso</th>
                <th className="py-3 px-3 text-right">Moedas</th>
                <th className="py-3 pl-3 pr-5 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {displayed.map((entry, idx) => {
                const pos = idx + 1;
                const isHighlighted = highlightId !== null && entry.id === highlightId;
                const posColor =
                  pos === 1
                    ? 'text-[#FBD000] font-bold'
                    : pos === 2
                    ? 'text-slate-200 font-bold'
                    : pos === 3
                    ? 'text-amber-500 font-bold'
                    : 'text-slate-400';

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isHighlighted
                        ? 'bg-[#E52521]/15 text-white'
                        : 'hover:bg-white/[0.03] text-slate-200'
                    }`}
                  >
                    <td className={`py-3 pl-5 pr-3 font-mono-tabular ${posColor}`}>
                      {pos}º
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[160px]">{entry.playerName}</span>
                        {entry.savedPrincess && (
                          <Crown
                            className="w-4 h-4 text-[#FBD000] shrink-0"
                            aria-label="Salvou a Princesa"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                      {entry.savedPrincess
                        ? 'Princesa Salva · 10/10'
                        : `Fase ${entry.stageReached} / 10`}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-tabular text-amber-300">
                      {entry.coins}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right font-mono-tabular font-bold text-white">
                      {entry.score.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
