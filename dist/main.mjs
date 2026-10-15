import { DURATION, LANES, MAX_HITS, initialGame, startGame, move, tick } from './core.mjs';

const KEY = 'orbit-escape-record-v1';
const $ = id => document.getElementById(id);
const arena = $('arena');
const overlay = $('overlay');
const effects = $('effects');
let game = initialGame();
let record = { wins: 0, effects: true };
let frame = null;

function readRecord() {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return;
    const value = JSON.parse(saved);
    if (!value || !Number.isSafeInteger(value.wins) || value.wins < 0 || typeof value.effects !== 'boolean') throw Error('invalid');
    record = value;
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* storage may be disabled */ }
    $('storage-message').textContent = '손상된 기록을 초기화하고 게임을 계속할 수 있습니다.';
  }
}

function saveRecord() {
  try { localStorage.setItem(KEY, JSON.stringify(record)); }
  catch { $('storage-message').textContent = '저장을 사용할 수 없어 이번 브라우저에서만 기록이 보입니다.'; }
}

function render() {
  const labels = { ready: '대기', playing: '진행 중', won: '성공', lost: '실패' };
  $('phase').textContent = labels[game.phase];
  $('time').textContent = `${((DURATION - game.elapsed) / 1000).toFixed(1)}초`;
  $('hits').textContent = `${Math.min(game.hits, MAX_HITS)} / ${MAX_HITS}`;
  $('wins').textContent = record.wins;
  $('player').style.left = `${(game.lane + .5) * 100 / LANES}%`;
  $('hazards').replaceChildren(...game.hazards.map(h => {
    const el = document.createElement('div');
    el.className = 'hazard';
    el.style.left = `calc(${(h.lane + .5) * 100 / LANES}% - 19px)`;
    el.style.top = `calc(${h.progress * 100}% - 38px)`;
    return el;
  }));
  $('left').disabled = game.phase !== 'playing' || game.lane === 0;
  $('right').disabled = game.phase !== 'playing' || game.lane === LANES - 1;
  overlay.classList.toggle('hidden', game.phase === 'playing');
  if (game.phase === 'won' || game.phase === 'lost') {
    $('overlay-title').textContent = game.phase === 'won' ? '탈출 성공!' : '충돌 3회, 실패';
    $('overlay-copy').textContent = game.phase === 'won' ? '20초를 버텼습니다. 한 판 더?' : '다시 도전해 보세요.';
    $('start').firstChild.textContent = '다시 시작 ';
  }
}

function loop(now) {
  const before = game.hits;
  game = tick(game, now);
  if (game.hits > before && record.effects) {
    arena.classList.remove('shake');
    void arena.offsetWidth;
    arena.classList.add('shake');
  }
  if (game.phase === 'won') { record.wins++; saveRecord(); }
  render();
  if (game.phase === 'playing') frame = requestAnimationFrame(loop);
  else frame = null;
}

function begin() {
  if (frame !== null) cancelAnimationFrame(frame);
  game = startGame(performance.now());
  render();
  frame = requestAnimationFrame(loop);
}

$('start').addEventListener('click', begin);
$('left').addEventListener('click', () => { game = move(game, -1); render(); });
$('right').addEventListener('click', () => { game = move(game, 1); render(); });
document.addEventListener('keydown', event => {
  if (event.repeat || game.phase !== 'playing') return;
  const direction = ['ArrowLeft', 'a', 'A'].includes(event.key) ? -1 : ['ArrowRight', 'd', 'D'].includes(event.key) ? 1 : 0;
  if (direction) { event.preventDefault(); game = move(game, direction); render(); }
});
effects.addEventListener('change', () => {
  record.effects = effects.checked;
  arena.classList.toggle('effects-on', record.effects);
  saveRecord();
});
$('reset-record').addEventListener('click', () => {
  record.wins = 0;
  saveRecord();
  $('storage-message').textContent = '완주 기록을 초기화했습니다.';
  render();
});
readRecord();
effects.checked = record.effects;
arena.classList.toggle('effects-on', record.effects);
render();
