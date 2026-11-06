'use strict';
(function () {
  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
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
  var score = { p1: 0, p2: 0 }; // pairs

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

  // ---------- YAADDASHT: 4x4 memory, most pairs wins ----------
  var mem = null;
  var MEM_EMOJIS = ['❤️', '🔥', '🎮', '🍕', '🎵', '⭐', '🚀', '🎲'];
  function beginGame() {
    var deck = shuffle(MEM_EMOJIS.concat(MEM_EMOJIS)).map(function (e) { return { emoji: e, flipped: false, matchedBy: null }; });
    mem = { cards: deck, turn: 'p1', pairs: { p1: 0, p2: 0 }, flipped: [], lock: false, over: false };
    renderMemory();
    updateMemoryMsg();
    maybeBotMemory();
    log('memory started');
  }
  function renderMemory() {
    var grid = $('memory-grid'); grid.innerHTML = '';
    mem.cards.forEach(function (c, i) {
      var b = el('button', 'mem-card' + (c.flipped ? ' flipped' : '') + (c.matchedBy ? ' matched ' + c.matchedBy : ''), '');
      b.type = 'button';
      b.textContent = (c.flipped || c.matchedBy) ? c.emoji : '?';
      b.onclick = function () { flipCard(i); };
      grid.appendChild(b);
    });
  }
  function updateMemoryMsg() {
    $('memory-msg').textContent = nameOf(mem.turn) + '\u2019s turn — flip two cards';
    $('memory-score').textContent = 'Pairs — ' + nameOf('p1') + ': ' + mem.pairs.p1 + ' · ' + nameOf('p2') + ': ' + mem.pairs.p2;
  }
  function flipCard(i) {
    if (!mem || mem.over || mem.lock) return;
    var c = mem.cards[i];
    if (c.flipped || c.matchedBy) return;
    c.flipped = true; mem.flipped.push(i);
    renderMemory();
    if (mem.flipped.length === 2) {
      mem.lock = true;
      later(function () {
        var a = mem.cards[mem.flipped[0]], b = mem.cards[mem.flipped[1]];
        if (a.emoji === b.emoji) {
          a.matchedBy = mem.turn; b.matchedBy = mem.turn;
          mem.pairs[mem.turn] += 1;
          score = { p1: mem.pairs.p1, p2: mem.pairs.p2 };
          renderScore();
          mem.flipped = []; mem.lock = false;
          renderMemory(); updateMemoryMsg();
          if (mem.pairs.p1 + mem.pairs.p2 >= 8) { endMemory(); return; }
          maybeBotMemory();
        } else {
          later(function () {
            a.flipped = false; b.flipped = false;
            mem.flipped = []; mem.lock = false;
            mem.turn = other(mem.turn);
            renderMemory(); updateMemoryMsg();
            maybeBotMemory();
          }, 450);
        }
      }, 450);
    }
  }
  function maybeBotMemory() {
    if (!mem || mem.over || state.mode !== 'bot' || mem.turn !== 'p2') return;
    later(function () {
      if (!mem || mem.over || mem.turn !== 'p2' || mem.lock) return;
      var avail = mem.cards.map(function (c, i) { return (c.flipped || c.matchedBy) ? -1 : i; }).filter(function (i) { return i >= 0; });
      if (avail.length < 2) return;
      var first = pick(avail);
      flipCard(first);
      later(function () {
        if (!mem || mem.over || mem.turn !== 'p2' || mem.lock) return;
        var avail2 = mem.cards.map(function (c, i) { return (c.flipped || c.matchedBy) ? -1 : i; }).filter(function (i) { return i >= 0; });
        if (avail2.length) flipCard(pick(avail2));
      }, 600);
    }, 700);
  }
  function endMemory() {
    if (!mem || mem.over) return;
    mem.over = true;
    score = { p1: mem.pairs.p1, p2: mem.pairs.p2 };
    renderScore();
    var winner = mem.pairs.p1 === mem.pairs.p2 ? 'tie' : (mem.pairs.p1 > mem.pairs.p2 ? 'p1' : 'p2');
    later(function () { endMatch(winner, 'Yaaddasht: ' + mem.pairs.p1 + '–' + mem.pairs.p2 + ' pairs.'); }, 700);
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
  $('btn-quit').addEventListener('click', function () { clearTimers(); state.active = false; showScreen('screen-lobby'); });
  $('btn-rematch').addEventListener('click', startMatch);
  $('btn-final-lobby').addEventListener('click', function () { showScreen('screen-lobby'); });

  window.__CHATPATA__ = { state: state, version: '2.10.0', game: 'yaaddasht' };
  log('yaaddasht 2.10.0 loaded');
})();
