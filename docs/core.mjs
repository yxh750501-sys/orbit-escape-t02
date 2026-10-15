export const DURATION = 20_000;
export const LANES = 5;
export const MAX_HITS = 3;
export const SPAWN_MS = 1000;
export const FALL_MS = 2400;

export function initialGame(spawnMs = SPAWN_MS) {
  return { phase: 'ready', lane: 2, elapsed: 0, hits: 0, hazards: [], nextId: 0, spawnMs, spawnAt: spawnMs, previousAt: null };
}

export function startGame(at = 0, spawnMs = SPAWN_MS) {
  return { ...initialGame(spawnMs), phase: 'playing', previousAt: at };
}

export function move(game, direction) {
  if (game.phase !== 'playing') return game;
  const lane = Math.max(0, Math.min(LANES - 1, game.lane + direction));
  return lane === game.lane ? game : { ...game, lane };
}

export function tick(game, at, random = Math.random) {
  if (game.phase !== 'playing') return game;
  const delta = Math.max(0, Math.min(100, at - game.previousAt));
  const elapsed = Math.min(DURATION, game.elapsed + delta);
  let { spawnAt, nextId, hits } = game;
  let hazards = game.hazards.map(h => ({ ...h, progress: h.progress + delta / FALL_MS }));
  while (elapsed >= spawnAt) {
    hazards.push({ id: nextId++, lane: Math.floor(random() * LANES), progress: 0 });
    spawnAt += game.spawnMs;
  }
  hazards = hazards.filter(h => {
    if (h.progress < 1) return true;
    if (h.lane === game.lane) hits++;
    return false;
  });
  return { ...game, elapsed, previousAt: at, spawnAt, nextId, hits,
    hazards, phase: hits >= MAX_HITS ? 'lost' : elapsed >= DURATION ? 'won' : 'playing' };
}
