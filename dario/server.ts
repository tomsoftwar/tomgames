import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  coins: number;
  stageReached: number;
  savedPrincess: boolean;
  createdAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const RANKING_FILE = path.join(DATA_DIR, 'ranking.json');
const PORT = Number(process.env.PORT) || 3000;

let writeLock: Promise<void> = Promise.resolve();

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRanking(): Promise<RankingEntry[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(RANKING_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RankingEntry[];
  } catch {
    return [];
  }
}

async function writeRanking(entries: RankingEntry[]): Promise<void> {
  await ensureDataDir();
  const tempPath = `${RANKING_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(entries, null, 2), 'utf-8');
  await fs.rename(tempPath, RANKING_FILE);
}

function sortRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.stageReached !== a.stageReached) return b.stageReached - a.stageReached;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/ranking', async (_req, res) => {
    try {
      const entries = await readRanking();
      res.json({ entries: sortRanking(entries).slice(0, 50) });
    } catch {
      res.status(500).json({ error: 'Falha ao carregar o ranking global.' });
    }
  });

  app.post('/api/ranking', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const rawName = typeof body.playerName === 'string' ? body.playerName.trim() : '';
      const cleanName = rawName.replace(/[^\p{L}\p{N}_\-\s]/gu, '').slice(0, 16).trim();
      const score = Number(body.score);
      const coins = Number(body.coins);
      const stageReached = Number(body.stageReached);
      const savedPrincess = Boolean(body.savedPrincess);

      if (cleanName.length < 2) {
        res.status(400).json({ error: 'Informe um nome entre 2 e 16 caracteres.' });
        return;
      }
      if (!Number.isFinite(score) || score < 0 || score > 9999999) {
        res.status(400).json({ error: 'Pontuação inválida.' });
        return;
      }
      if (!Number.isFinite(coins) || coins < 0 || coins > 99999) {
        res.status(400).json({ error: 'Contagem de moedas inválida.' });
        return;
      }
      if (!Number.isFinite(stageReached) || stageReached < 1 || stageReached > 10) {
        res.status(400).json({ error: 'Fase inválida.' });
        return;
      }

      const newEntry: RankingEntry = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        playerName: cleanName,
        score: Math.floor(score),
        coins: Math.floor(coins),
        stageReached: Math.floor(stageReached),
        savedPrincess,
        createdAt: new Date().toISOString(),
      };

      let savedList: RankingEntry[] = [];
      writeLock = writeLock.then(async () => {
        const current = await readRanking();
        const updated = sortRanking([...current, newEntry]).slice(0, 100);
        await writeRanking(updated);
        savedList = updated;
      });
      await writeLock;

      const rankIndex = savedList.findIndex((item) => item.id === newEntry.id);
      res.status(201).json({
        entry: newEntry,
        rank: rankIndex >= 0 ? rankIndex + 1 : null,
        entries: savedList.slice(0, 50),
      });
    } catch {
      res.status(500).json({ error: 'Não foi possível salvar a pontuação no servidor.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TomGames DARIO Adventure server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
