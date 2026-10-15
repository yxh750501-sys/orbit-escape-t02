import assert from 'node:assert/strict';
import { DURATION, initialGame, startGame, move, tick } from './dist/core.mjs';

const random = () => .5;
let game = startGame(0);
assert.equal(move(game, -1).lane, 1);
assert.equal(move(game, 1).lane, 3);
assert.equal(move(move(move(game, -1), -1), -1).lane, 0);
assert.equal(move(move(move(game, 1), 1), 1).lane, 4);
assert.equal(move(game, 0), game);
assert.equal(initialGame().phase, 'ready');

function run(spawnMs, seed, strategy = 'move') {
  let state = startGame(0, spawnMs);
  let now = 0;
  let n = seed;
  const rng = () => ((n = (1664525 * n + 1013904223) >>> 0) / 2 ** 32);
  while (state.phase === 'playing' && now < 30_000) {
    now += 50;
    if (strategy === 'move' && now % 500 === 0) state = move(state, rng() < .5 ? -1 : 1);
    state = tick(state, now, rng);
  }
  assert.notEqual(state.phase, 'playing');
  assert.ok(now <= 30_000);
  return state;
}

const won = run(850, 1, 'still');
assert.equal(won.phase, 'lost');
const forcedWin = (() => {
  let s = startGame(0);
  for (let now = 50; now <= DURATION; now += 50) s = tick(s, now, () => 0);
  return s;
})();
assert.equal(forcedWin.phase, 'won');
for (const ended of [won, forcedWin]) {
  const restarted = startGame(30_000);
  assert.equal(restarted.phase, 'playing');
  assert.equal(restarted.elapsed, 0);
  assert.equal(restarted.hits, 0);
  assert.equal(restarted.lane, 2);
  assert.equal(restarted.hazards.length, 0);
  assert.equal(move(ended, 1), ended);
}

const report = [850, 1000].map(spawnMs => {
  const results = Array.from({ length: 10 }, (_, i) => run(spawnMs, i + 1));
  return { spawnMs, plays: results.length, wins: results.filter(s => s.phase === 'won').length,
    averageSeconds: +(results.reduce((sum, s) => sum + s.elapsed, 0) / results.length / 1000).toFixed(1) };
});
let virtualTime = 0;
let replayCount = 0;
while (virtualTime < 600_000) {
  virtualTime += run(1000, replayCount + 100).elapsed;
  replayCount++;
}
console.log(JSON.stringify({ boundary: 'passed', successAndFailureRestart: 'passed',
  twentySimulatedPlays: report, tenMinuteVirtualRun: { virtualSeconds: virtualTime / 1000, replayCount } }, null, 2));
