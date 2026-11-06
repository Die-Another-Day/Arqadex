'use strict';
(function () {
  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';
  function log(msg) {
    if (!DEBUG) return;
    var box = $('debug-log'); if (!box) return;
    box.classList.add('on');
    box.textContent += (box.textContent ? '\n' : '') + msg;
    box.scrollTop = box.scrollHeight;
  }

  // ---------- state ----------
  var state = { mode: 'duo', p1: 'ALEX', p2: 'SAM', topPlayer: 'p1', bottomPlayer: 'p2', active: false };
  function nameOf(p) { return p === 'p1' ? state.p1 : state.p2; }
  function other(p) { return p === 'p1' ? 'p2' : 'p1'; }
  var score = { p1: 0, p2: 0 }; // round wins

  var timers = [];
  var intervals = [];
  var rafId = 0;
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function every(fn, ms) { var id = setInterval(fn, ms); intervals.push(id); return id; }
  function clearTimers() {
    timers.forEach(clearTimeout); intervals.forEach(clearInterval);
    timers = []; intervals = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function showScreen(id) {
    ['screen-lobby', 'screen-match', 'screen-final'].forEach(function (s) { $(s).classList.add('hidden'); });
    $(id).classList.remove('hidden');
    window.scrollTo(0, 0);
  }
  function renderScore() {
    $('match-score').innerHTML =
      '<div class="row' + (score.p1 > score.p2 ? ' leader' : '') + '"><span class="p1n">◆ ' + escapeHtml(state.p1) + '</span><span>' + score.p1 + '</span></div>' +
      '<div class="row' + (score.p2 > score.p1 ? ' leader' : '') + '"><span class="p2n">◆ ' + escapeHtml(state.p2) + '</span><span>' + score.p2 + '</span></div>';
  }
  function setMsg(t) { $('match-msg').textContent = t || ''; }

  var DARES = [
    'Loser buys chai for two. No arguing.',
    'Loser picks the next movie — winner picks the snacks.',
    'Loser does the dishes tonight.',
    'Loser owes winner a 5-minute shoulder massage.',
    'Loser has to cook (or order) winner\u2019s favourite food.',
    'Loser does winner\u2019s phone-charging duty for a day.',
    'Loser picks the next date spot — winner picks the playlist.'
  ];

  function startMatch() {
    state.p1 = ($('name-p1').value || 'ALEX').trim().toUpperCase().slice(0, 12) || 'ALEX';
    state.p2 = state.mode === 'bot' ? 'BOT' : (($('name-p2').value || 'SAM').trim().toUpperCase().slice(0, 12) || 'SAM');
    score = { p1: 0, p2: 0 };
    state.topPlayer = state.mode === 'bot' ? 'p2' : 'p1';
    state.bottomPlayer = state.mode === 'bot' ? 'p1' : 'p2';
    state.active = true;
    showScreen('screen-match');
    renderScore(); setMsg('');
    log('match start mode=' + state.mode + ' p1=' + state.p1 + ' p2=' + state.p2);
    beginGame();
  }

  function endMatch(winner, label) {
    if (!state.active) return;
    state.active = false;
    clearTimers();
    renderScore();
    $('winner-name').textContent = winner === 'tie' ? 'BARABAR! DRAW!' : nameOf(winner) + ' JEET GAYA!';
    $('winner-line').textContent = winner === 'tie'
      ? 'Dono barabar — rematch to banta hai!'
      : nameOf(winner) + ' aaj ka champion hai. ' + nameOf(other(winner)) + ', ye lo tumhara dare:';
    $('final-scores').innerHTML =
      '<div class="row' + (score.p1 > score.p2 ? ' leader' : '') + '"><span class="p1n">◆ ' + escapeHtml(state.p1) + '</span><span>' + score.p1 + '</span></div>' +
      '<div class="row' + (score.p2 > score.p1 ? ' leader' : '') + '"><span class="p2n">◆ ' + escapeHtml(state.p2) + '</span><span>' + score.p2 + '</span></div>';
    $('dare-box').textContent = winner === 'tie'
      ? '🏆 Aaj koi dare nahi. Rematch karo!'
      : '🏆 HARNE WAALE KA DARE — ' + nameOf(other(winner)) + ': ' + pick(DARES);
    setMsg(label || '');
    showScreen('screen-final');
    log('match end winner=' + winner);
  }

  // ---------- TAP DHAMAKA: 10s tap race, best of 3 rounds ----------
  var tap = { round: 1, counts: { p1: 0, p2: 0 }, left: 10, running: false };
  function beginGame() {
    tap = { round: 1, counts: { p1: 0, p2: 0 }, left: 10, running: false };
    tapRound();
  }
  function tapRound() {
    tap.counts = { p1: 0, p2: 0 }; tap.left = 10; tap.running = true;
    $('tap-p1-name').textContent = nameOf(state.topPlayer);
    $('tap-p2-name').textContent = nameOf(state.bottomPlayer);
    $('tap-p1-count').textContent = '0'; $('tap-p2-count').textContent = '0';
    $('tap-timer').textContent = '10';
    $('tap-msg').textContent = 'ROUND ' + tap.round + ' — TAP! TAP! TAP!';
    every(function () {
      tap.left -= 1;
      $('tap-timer').textContent = String(Math.max(0, tap.left));
      if (tap.left <= 0) endTapRound();
    }, 1000);
    if (state.mode === 'bot') botTapLoop();
    log('tap round ' + tap.round + ' started');
  }
  function botTapLoop() {
    if (!tap.running) return;
    tap.counts.p2 += 1;
    // bot is p2: its display is the TOP zone in bot mode (tap-p1-count),
    // the BOTTOM zone in duo mode — same mapping as tapHit().
    var id = 'p2' === state.topPlayer ? 'tap-p1-count' : 'tap-p2-count';
    $(id).textContent = String(tap.counts.p2);
    later(botTapLoop, rand(115, 175));
  }
  function tapHit(player) {
    if (!tap.running) return;
    tap.counts[player] += 1;
    var id = player === state.topPlayer ? 'tap-p1-count' : 'tap-p2-count';
    $(id).textContent = String(tap.counts[player]);
  }
  function endTapRound() {
    if (!tap.running) return;
    tap.running = false;
    clearTimers();
    var a = tap.counts[state.topPlayer], b = tap.counts[state.bottomPlayer];
    var winner = a === b ? 'tie' : (a > b ? state.topPlayer : state.bottomPlayer);
    $('tap-msg').textContent = nameOf(state.topPlayer) + ' ' + a + ' — ' + b + ' ' + nameOf(state.bottomPlayer);
    if (winner !== 'tie') { score[winner] += 1; renderScore(); }
    log('tap round ' + tap.round + ' end ' + a + ' vs ' + b + ' winner=' + winner);
    if (winner !== 'tie' && score[winner] >= 2) {
      later(function () { endMatch(winner, 'Tap Dhamaka: ' + a + ' vs ' + b + ' taps, round ' + tap.round + '.'); }, 900);
      return;
    }
    if (tap.round >= 3) {
      var w = score.p1 === score.p2 ? 'tie' : (score.p1 > score.p2 ? 'p1' : 'p2');
      later(function () { endMatch(w, 'Tap Dhamaka: 3 rounds khatam.'); }, 900);
      return;
    }
    tap.round += 1;
    later(tapRound, 1300);
  }

  // ---------- wiring ----------
  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      btn.classList.add('selected');
      state.mode = btn.getAttribute('data-mode');
      $('name-p2').disabled = state.mode === 'bot';
      $('mode-hint').textContent = state.mode === 'bot'
        ? 'Bot se khelo: tum neeche (cyan) wali side se khelo. Bot upar (pink) se khelega.'
        : 'Same phone: sit opposite each other, phone flat between you. P1 plays the top half, P2 the bottom half.';
      log('mode=' + state.mode);
    });
  });
  $('btn-start').addEventListener('click', startMatch);
  $('tap-p1').addEventListener('pointerdown', function (e) { e.preventDefault(); tapHit(state.topPlayer); });
  $('tap-p2').addEventListener('pointerdown', function (e) { e.preventDefault(); tapHit(state.bottomPlayer); });
  $('btn-quit').addEventListener('click', function () { clearTimers(); state.active = false; showScreen('screen-lobby'); });
  $('btn-rematch').addEventListener('click', startMatch);
  $('btn-final-lobby').addEventListener('click', function () { showScreen('screen-lobby'); });

  window.__CHATPATA__ = { state: state, version: '2.10.0', game: 'tap-dhamaka' };
  log('tap-dhamaka 2.10.0 loaded');
})();
