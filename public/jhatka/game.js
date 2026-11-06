'use strict';
(function () {
  // ---------- theme: ?theme= wins, then the Arqadex shell theme, then the OS ----------
  // The shell sets data-theme on its own <html> (daylight = light, the rest dark).
  // Standalone (opened directly) the OS prefers-color-scheme decides, live.
  (function applyChatpataTheme() {
    function setTheme(t) { document.documentElement.dataset.theme = t; }
    function fromSiteTheme(t) { return t === 'daylight' ? 'light' : 'dark'; }
    try {
      var q = new URLSearchParams(window.location.search).get('theme');
      if (q) { setTheme(q === 'light' || q === 'daylight' ? 'light' : 'dark'); return; }
      if (window.parent && window.parent !== window) {
        var pt = window.parent.document.documentElement.getAttribute('data-theme');
        if (pt) {
          setTheme(fromSiteTheme(pt));
          try {
            var obs = new window.parent.MutationObserver(function () {
              var t2 = window.parent.document.documentElement.getAttribute('data-theme');
              if (t2) setTheme(fromSiteTheme(t2));
            });
            obs.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
          } catch (err2) { /* theme changes need a reload */ }
          return;
        }
      }
    } catch (err) { /* cross-origin: fall through to the OS */ }
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    setTheme(mq.matches ? 'light' : 'dark');
    if (mq.addEventListener) mq.addEventListener('change', function (e) { setTheme(e.matches ? 'light' : 'dark'); });
  })();

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

  // ---------- JHATKA: reaction duel, best of 3 rounds ----------
  var react = { round: 1, phase: 'idle', goTime: 0, resolved: false };
  function beginGame() {
    react = { round: 1, phase: 'idle', goTime: 0, resolved: false };
    $('react-p1-name').textContent = nameOf(state.topPlayer);
    $('react-p2-name').textContent = nameOf(state.bottomPlayer);
    $('react-p1').classList.remove('live', 'wait', 'fouled');
    $('react-p2').classList.remove('live', 'wait', 'fouled');
    reactionRound();
  }
  function reactionRound() {
    react.phase = 'waiting'; react.resolved = false;
    $('react-round').textContent = 'Round ' + react.round + ' of 3 · ' + nameOf(state.topPlayer) + ' ' + score[state.topPlayer] + ' — ' + score[state.bottomPlayer] + ' ' + nameOf(state.bottomPlayer);
    $('react-msg').textContent = 'WAIT FOR GREEN…';
    var z1 = $('react-p1'), z2 = $('react-p2');
    z1.classList.remove('live', 'fouled'); z2.classList.remove('live', 'fouled');
    z1.classList.add('wait'); z2.classList.add('wait');
    later(function () {
      if (!state.active || react.phase !== 'waiting') return;
      react.phase = 'go'; react.goTime = performance.now();
      $('react-msg').textContent = 'TAP NOW!';
      z1.classList.remove('wait'); z2.classList.remove('wait');
      z1.classList.add('live'); z2.classList.add('live');
      if (state.mode === 'bot') {
        later(function () {
          if (react.phase === 'go' && !react.resolved) reactTap('p2');
        }, rand(220, 480));
      }
    }, rand(1500, 4000));
  }
  function reactTap(player) {
    if (!state.active || react.resolved) return;
    if (react.phase === 'waiting') {
      react.resolved = true;
      var winner = other(player);
      $('react-msg').textContent = nameOf(player) + ' FALSE START! ' + nameOf(winner) + ' takes the round.';
      (player === state.topPlayer ? $('react-p1') : $('react-p2')).classList.add('fouled');
      reactWinRound(winner);
      return;
    }
    if (react.phase !== 'go') return;
    react.resolved = true;
    var ms = Math.round(performance.now() - react.goTime);
    $('react-msg').textContent = nameOf(player) + ' — ' + ms + 'ms! Round won.';
    reactWinRound(player);
  }
  function reactWinRound(winner) {
    score[winner] += 1;
    renderScore();
    if (score[winner] >= 2) {
      later(function () { endMatch(winner, 'Jhatka: ' + score[winner] + '–' + score[other(winner)] + ' rounds.'); }, 1100);
    } else {
      react.round += 1;
      later(reactionRound, 1400);
    }
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
  $('react-p1').addEventListener('pointerdown', function (e) { e.preventDefault(); reactTap(state.topPlayer); });
  $('react-p2').addEventListener('pointerdown', function (e) { e.preventDefault(); reactTap(state.bottomPlayer); });
  $('btn-quit').addEventListener('click', function () { clearTimers(); state.active = false; showScreen('screen-lobby'); });
  $('btn-rematch').addEventListener('click', startMatch);
  $('btn-final-lobby').addEventListener('click', function () { showScreen('screen-lobby'); });

  window.__CHATPATA__ = { state: state, version: '2.12.0', game: 'jhatka' };
  log('jhatka 2.12.0 loaded');
})();
