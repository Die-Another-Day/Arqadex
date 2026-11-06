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
  var state = {
    mode: 'duo', // 'duo' | 'bot'
    p1: 'ALEX',
    p2: 'SAM',
    topPlayer: 'p1',    // player who plays the TOP half (duo: p1, bot: p2/BOT)
    bottomPlayer: 'p2', // player who plays the BOTTOM half
    scores: { p1: 0, p2: 0 }, // tournament game-points
    gameIndex: 0,
    active: false
  };
  function nameOf(p) { return p === 'p1' ? state.p1 : state.p2; }
  function other(p) { return p === 'p1' ? 'p2' : 'p1'; }

  var GAMES = [
    { id: 'reaction', title: 'REACTION RUSH', sub: 'Wait for green. Tap YOUR half. False start loses the round. Best of 3 rounds.' },
    { id: 'tap', title: 'TAP STORM', sub: '10 seconds. Tap your half as fast as you can. Most taps wins.' },
    { id: 'hockey', title: 'AIR HOCKEY DUEL', sub: 'Drag your paddle. First to 3 goals — or most goals in 60 seconds.' },
    { id: 'memory', title: 'MEMORY DUEL', sub: 'Flip two cards. Match a pair, keep it and go again. Most pairs wins.' },
    { id: 'quiz', title: 'KNOW ME QUIZ', sub: 'Answer about yourself. Your partner guesses. 6 rounds — most correct guesses wins.' }
  ];

  var timers = [];
  var intervals = [];
  var rafId = 0;
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function every(fn, ms) { var id = setInterval(fn, ms); intervals.push(id); return id; }
  function clearGameTimers() {
    timers.forEach(clearTimeout); intervals.forEach(clearInterval);
    timers = []; intervals = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  // ---------- screens ----------
  function showScreen(id) {
    ['screen-lobby', 'screen-match', 'screen-final'].forEach(function (s) { $(s).classList.add('hidden'); });
    $(id).classList.remove('hidden');
    window.scrollTo(0, 0);
  }
  function showStage(id) {
    ['stage-reaction', 'stage-tap', 'stage-hockey', 'stage-memory', 'stage-quiz'].forEach(function (s) { $(s).classList.add('hidden'); });
    if (id) $(id).classList.remove('hidden');
  }
  function renderScore() {
    var s = state.scores;
    var rows = '';
    rows += '<div class="row' + (s.p1 > s.p2 ? ' leader' : '') + '"><span class="p1n">◆ ' + escapeHtml(state.p1) + '</span><span>' + s.p1 + ' pts</span></div>';
    rows += '<div class="row' + (s.p2 > s.p1 ? ' leader' : '') + '"><span class="p2n">◆ ' + escapeHtml(state.p2) + '</span><span>' + s.p2 + ' pts</span></div>';
    $('match-score').innerHTML = rows;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setMsg(t) { $('match-msg').textContent = t || ''; }

  // ---------- tournament flow ----------
  function startMatch() {
    state.p1 = ($('name-p1').value || 'ALEX').trim().toUpperCase().slice(0, 12) || 'ALEX';
    state.p2 = state.mode === 'bot' ? 'BOT' : (($('name-p2').value || 'SAM').trim().toUpperCase().slice(0, 12) || 'SAM');
    state.scores = { p1: 0, p2: 0 };
    state.gameIndex = 0;
    state.topPlayer = state.mode === 'bot' ? 'p2' : 'p1';
    state.bottomPlayer = state.mode === 'bot' ? 'p1' : 'p2';
    state.active = true;
    log('match start mode=' + state.mode + ' p1=' + state.p1 + ' p2=' + state.p2);
    showScreen('screen-match');
    startGame(0);
  }

  function startGame(idx) {
    clearGameTimers();
    state.gameIndex = idx;
    var g = GAMES[idx];
    $('match-progress').textContent = 'GAME ' + (idx + 1) + ' / 5';
    $('game-title').textContent = g.title;
    $('game-sub').textContent = g.sub;
    $('btn-next-game').classList.add('hidden');
    setMsg('');
    renderScore();
    log('game start ' + g.id);
    if (g.id === 'reaction') startReaction();
    else if (g.id === 'tap') startTap();
    else if (g.id === 'hockey') startHockey();
    else if (g.id === 'memory') startMemory();
    else if (g.id === 'quiz') startQuiz();
  }

  function endGame(winner, label) {
    if (!state.active) return;
    state.active = false;
    clearGameTimers();
    if (winner === 'p1' || winner === 'p2') state.scores[winner] += 1;
    renderScore();
    var text = winner === 'tie'
      ? 'TIE — no point. ' + label
      : nameOf(winner) + ' takes the point! ' + label;
    setMsg(text);
    log('game end winner=' + winner + ' scores=' + JSON.stringify(state.scores));
    var done = state.scores.p1 >= 3 || state.scores.p2 >= 3 || state.gameIndex >= 4;
    var btn = $('btn-next-game');
    btn.textContent = done ? 'SEE THE WINNER →' : 'NEXT CHALLENGE →';
    btn.classList.remove('hidden');
    btn.onclick = function () { if (done) showFinal(); else { state.active = true; startGame(state.gameIndex + 1); } };
  }

  var DARES = [
    'Loser buys chai for two. No arguing.',
    'Loser picks the next movie — winner picks the snacks.',
    'Loser does the dishes tonight.',
    'Loser owes winner a 5-minute shoulder massage.',
    'Loser has to cook (or order) winner\u2019s favourite food.',
    'Loser does winner\u2019s phone-charging duty for a day.',
    'Loser picks the next date spot — winner picks the playlist.'
  ];
  function showFinal() {
    clearGameTimers();
    var s = state.scores;
    var winner = s.p1 === s.p2 ? null : (s.p1 > s.p2 ? 'p1' : 'p2');
    var loser = winner ? other(winner) : null;
    $('winner-name').textContent = winner ? nameOf(winner) + ' WINS!' : 'IT\u2019S A DRAW!';
    $('winner-line').textContent = winner
      ? nameOf(winner) + ' is officially the better half tonight. ' + nameOf(loser) + ', rematch or accept your fate below.'
      : 'Dead even after 5 games. The only honest answer is a rematch.';
    $('final-scores').innerHTML =
      '<div class="row' + (s.p1 > s.p2 ? ' leader' : '') + '"><span class="p1n">◆ ' + escapeHtml(state.p1) + '</span><span>' + s.p1 + ' pts</span></div>' +
      '<div class="row' + (s.p2 > s.p1 ? ' leader' : '') + '"><span class="p2n">◆ ' + escapeHtml(state.p2) + '</span><span>' + s.p2 + ' pts</span></div>';
    $('dare-box').textContent = winner ? '🏆 LOSER\u2019S DARE — ' + nameOf(loser) + ': ' + pick(DARES) : '🏆 No dare this time. Run it back.';
    showScreen('screen-final');
    log('final winner=' + (winner || 'draw'));
  }

  // ---------- GAME 1: REACTION ----------
  var react = { round: 1, wins: { p1: 0, p2: 0 }, phase: 'idle', goTime: 0, resolved: false };
  function startReaction() {
    showStage('stage-reaction');
    react = { round: 1, wins: { p1: 0, p2: 0 }, phase: 'idle', goTime: 0, resolved: false };
    $('react-p1-name').textContent = nameOf(state.topPlayer);
    $('react-p2-name').textContent = nameOf(state.bottomPlayer);
    $('react-p1').classList.remove('live', 'wait', 'fouled');
    $('react-p2').classList.remove('live', 'wait', 'fouled');
    reactionRound();
  }
  function reactionRound() {
    react.phase = 'waiting'; react.resolved = false;
    $('react-round').textContent = 'Round ' + react.round + ' of 3 · ' + nameOf(state.topPlayer) + ' ' + react.wins[state.topPlayer] + ' — ' + react.wins[state.bottomPlayer] + ' ' + nameOf(state.bottomPlayer);
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
    react.wins[winner] += 1;
    if (react.wins[winner] >= 2) {
      later(function () { endGame(winner, nameOf(winner) + ' won Reaction Rush ' + react.wins[winner] + '–' + react.wins[other(winner)] + '.'); }, 1100);
    } else {
      react.round += 1;
      later(reactionRound, 1400);
    }
  }

  // ---------- GAME 2: TAP STORM ----------
  var tap = { counts: { p1: 0, p2: 0 }, left: 10, running: false, botTimer: 0 };
  function startTap() {
    showStage('stage-tap');
    tap = { counts: { p1: 0, p2: 0 }, left: 10, running: true, botTimer: 0 };
    $('tap-p1-name').textContent = nameOf(state.topPlayer);
    $('tap-p2-name').textContent = nameOf(state.bottomPlayer);
    $('tap-p1-count').textContent = '0'; $('tap-p2-count').textContent = '0';
    $('tap-timer').textContent = '10';
    $('tap-msg').textContent = 'TAP! TAP! TAP!';
    var tick = every(function () {
      tap.left -= 1;
      $('tap-timer').textContent = String(Math.max(0, tap.left));
      if (tap.left <= 0) endTap();
    }, 1000);
    if (state.mode === 'bot') botTapLoop();
    log('tap storm started');
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
  function endTap() {
    if (!tap.running) return;
    tap.running = false;
    clearGameTimers();
    var a = tap.counts[state.topPlayer], b = tap.counts[state.bottomPlayer];
    $('tap-msg').textContent = nameOf(state.topPlayer) + ' ' + a + ' — ' + b + ' ' + nameOf(state.bottomPlayer);
    var winner = a === b ? 'tie' : (a > b ? state.topPlayer : state.bottomPlayer);
    later(function () { endGame(winner, 'Tap Storm: ' + a + ' vs ' + b + ' taps.'); }, 900);
  }

  // ---------- GAME 3: AIR HOCKEY ----------
  var hockey = null;
  function startHockey() {
    showStage('stage-hockey');
    var cv = $('hockey-canvas');
    var ctx = cv.getContext('2d');
    hockey = {
      ctx: ctx, cv: cv,
      top: { x: 180, y: 90, r: 26 },
      bottom: { x: 180, y: 430, r: 26 },
      puck: { x: 180, y: 260, vx: rand(2, 3) * (Math.random() < 0.5 ? -1 : 1), vy: rand(2, 3) * (Math.random() < 0.5 ? -1 : 1), r: 11 },
      goals: { p1: 0, p2: 0 },
      timeLeft: 60, over: false,
      pointers: {}
    };
    updateHockeyScore();
    $('hockey-timer').textContent = '60s left · first to 3';
    every(function () {
      if (!hockey || hockey.over) return;
      hockey.timeLeft -= 1;
      $('hockey-timer').textContent = hockey.timeLeft + 's left · first to 3';
      if (hockey.timeLeft <= 0) endHockey();
    }, 1000);
    hockeyLoop();
    log('hockey started');
  }
  function updateHockeyScore() {
    var t = state.topPlayer, b = state.bottomPlayer;
    $('hockey-score').textContent = nameOf(t) + ' ' + hockey.goals[t] + ' — ' + hockey.goals[b] + ' ' + nameOf(b);
  }
  function hockeyPos(e) {
    var r = hockey.cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (360 / r.width), y: (e.clientY - r.top) * (520 / r.height) };
  }
  function clampPaddle(p, side) {
    p.x = Math.max(28, Math.min(332, p.x));
    if (side === 'top') p.y = Math.max(28, Math.min(238, p.y));
    else p.y = Math.max(282, Math.min(492, p.y));
  }
  function hockeyLoop() {
    if (!hockey || hockey.over) return;
    var h = hockey, puck = h.puck;
    // bot AI: top paddle
    if (state.mode === 'bot') {
      var targetX = puck.y < 260 ? puck.x : 180;
      var targetY = puck.y < 260 ? Math.max(40, Math.min(220, puck.y - 20)) : 90;
      h.top.x += Math.max(-4.5, Math.min(4.5, targetX - h.top.x));
      h.top.y += Math.max(-4.5, Math.min(4.5, targetY - h.top.y));
    }
    // puck physics
    puck.x += puck.vx; puck.y += puck.vy;
    puck.vx *= 0.995; puck.vy *= 0.995;
    if (puck.x < puck.r + 4) { puck.x = puck.r + 4; puck.vx = Math.abs(puck.vx); }
    if (puck.x > 356 - puck.r) { puck.x = 356 - puck.r; puck.vx = -Math.abs(puck.vx); }
    // goals: centre gap 120..240
    if (puck.y < 6) {
      if (puck.x > 120 && puck.x < 240) { goalScored(state.bottomPlayer); }
      else { puck.y = 6; puck.vy = Math.abs(puck.vy); }
    }
    if (puck.y > 514) {
      if (puck.x > 120 && puck.x < 240) { goalScored(state.topPlayer); }
      else { puck.y = 514; puck.vy = -Math.abs(puck.vy); }
    }
    // paddle collisions
    [ ['top', h.top], ['bottom', h.bottom] ].forEach(function (pair) {
      var p = pair[1];
      var dx = puck.x - p.x, dy = puck.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var min = p.r + puck.r;
      if (d > 0 && d < min) {
        var nx = dx / d, ny = dy / d;
        puck.x = p.x + nx * min; puck.y = p.y + ny * min;
        var speed = Math.max(4, Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy) + 1.2);
        puck.vx = nx * speed; puck.vy = ny * speed;
      }
    });
    drawHockey();
    rafId = requestAnimationFrame(hockeyLoop);
  }
  function goalScored(scorer) {
    if (!hockey || hockey.over) return;
    hockey.goals[scorer] += 1;
    updateHockeyScore();
    log('hockey goal ' + scorer + ' ' + JSON.stringify(hockey.goals));
    hockey.puck = { x: 180, y: 260, vx: rand(2, 3) * (Math.random() < 0.5 ? -1 : 1), vy: rand(2, 3), r: 11 };
    if (hockey.goals[scorer] >= 3) { endHockey(); return; }
    $('hockey-timer').textContent = 'GOAL! ' + nameOf(scorer) + ' scores · ' + hockey.timeLeft + 's left';
  }
  function endHockey() {
    if (!hockey || hockey.over) return;
    hockey.over = true;
    clearGameTimers();
    var a = hockey.goals[state.topPlayer], b = hockey.goals[state.bottomPlayer];
    var winner = a === b ? 'tie' : (a > b ? state.topPlayer : state.bottomPlayer);
    later(function () { endGame(winner, 'Air Hockey: ' + a + '–' + b + '.'); }, 800);
  }
  function drawHockey() {
    var ctx = hockey.ctx;
    ctx.clearRect(0, 0, 360, 520);
    ctx.fillStyle = '#070724'; ctx.fillRect(0, 0, 360, 520);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 352, 512);
    ctx.beginPath(); ctx.moveTo(4, 260); ctx.lineTo(356, 260); ctx.stroke();
    ctx.beginPath(); ctx.arc(180, 260, 52, 0, Math.PI * 2); ctx.stroke();
    // goals
    ctx.fillStyle = 'rgba(255,45,166,.35)'; ctx.fillRect(120, 4, 120, 8);
    ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.fillRect(120, 508, 120, 8);
    // puck
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hockey.puck.x, hockey.puck.y, hockey.puck.r, 0, Math.PI * 2); ctx.fill();
    // paddles
    ctx.fillStyle = '#FF2DA6'; ctx.beginPath(); ctx.arc(hockey.top.x, hockey.top.y, hockey.top.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050514'; ctx.beginPath(); ctx.arc(hockey.top.x, hockey.top.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00F5FF'; ctx.beginPath(); ctx.arc(hockey.bottom.x, hockey.bottom.y, hockey.bottom.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050514'; ctx.beginPath(); ctx.arc(hockey.bottom.x, hockey.bottom.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = 'bold 11px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(nameOf(state.topPlayer), 180, 30);
    ctx.save(); ctx.translate(180, 500); ctx.rotate(Math.PI); ctx.fillText(nameOf(state.bottomPlayer), 0, 0); ctx.restore();
  }

  // ---------- GAME 4: MEMORY ----------
  var mem = null;
  var MEM_EMOJIS = ['❤️', '🔥', '🎮', '🍕', '🎵', '⭐', '🚀', '🎲'];
  function startMemory() {
    showStage('stage-memory');
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
    var winner = mem.pairs.p1 === mem.pairs.p2 ? 'tie' : (mem.pairs.p1 > mem.pairs.p2 ? 'p1' : 'p2');
    later(function () { endGame(winner, 'Memory: ' + mem.pairs.p1 + '–' + mem.pairs.p2 + ' pairs.'); }, 700);
  }

  // ---------- GAME 5: KNOW ME QUIZ ----------
  var QUIZ_BANK = [
    { q: 'favourite food', opts: ['Pizza', 'Biryani', 'Momos'] },
    { q: 'dream trip', opts: ['Goa beach', 'Mountains', 'Paris'] },
    { q: 'ideal date', opts: ['Movie night', 'Long drive', 'Cooking together'] },
    { q: 'superpower', opts: ['Teleport', 'Read minds', 'Time travel'] },
    { q: 'favourite movie vibe', opts: ['Action', 'Romance', 'Horror'] },
    { q: 'guilty pleasure', opts: ['Reality TV', 'Midnight snacks', 'Online shopping'] }
  ];
  var quiz = null;
  function startQuiz() {
    showStage('stage-quiz');
    quiz = { round: 0, points: { p1: 0, p2: 0 }, secret: -1, over: false };
    quizRoundPassAnswer();
    log('quiz started');
  }
  function quizAnswerer() { return quiz.round % 2 === 0 ? 'p1' : 'p2'; }
  function quizGuesser() { return other(quizAnswerer()); }
  function quizRoundPassAnswer() {
    var a = quizAnswerer(), g = quizGuesser();
    $('quiz-msg').textContent = 'ROUND ' + (quiz.round + 1) + ' / 6';
    var body = $('quiz-body'); body.innerHTML = '';
    body.appendChild(el('div', 'quiz-q', 'PASS THE PHONE TO ' + nameOf(a)));
    body.appendChild(el('p', 'tag center', nameOf(g) + ' — look away! No peeking.'));
    var b = el('button', 'btn primary', 'I\u2019M ' + nameOf(a) + ' — SHOW MY QUESTION');
    b.type = 'button'; b.style.width = '100%';
    b.onclick = quizShowAnswer;
    body.appendChild(b);
  }
  function quizShowAnswer() {
    var a = quizAnswerer();
    var item = QUIZ_BANK[quiz.round];
    $('quiz-msg').textContent = nameOf(a) + ' — answer honestly';
    var body = $('quiz-body'); body.innerHTML = '';
    body.appendChild(el('div', 'quiz-q', 'What is ' + nameOf(a) + '\u2019s ' + item.q + '?'));
    item.opts.forEach(function (opt, i) {
      var b = el('button', 'quiz-opt', opt);
      b.type = 'button';
      b.onclick = function () { quiz.secret = i; quizRoundPassGuess(); };
      body.appendChild(b);
    });
    if (state.mode === 'bot' && a === 'p2') {
      later(function () { quiz.secret = randInt(0, 2); quizRoundPassGuess(); }, 900);
    }
  }
  function quizRoundPassGuess() {
    var a = quizAnswerer(), g = quizGuesser();
    $('quiz-msg').textContent = 'ROUND ' + (quiz.round + 1) + ' / 6';
    var body = $('quiz-body'); body.innerHTML = '';
    body.appendChild(el('div', 'quiz-q', 'PASS THE PHONE TO ' + nameOf(g)));
    body.appendChild(el('p', 'tag center', nameOf(a) + ' — look away now. ' + nameOf(g) + ' has to guess your answer.'));
    var b = el('button', 'btn primary', 'I\u2019M ' + nameOf(g) + ' — LET ME GUESS');
    b.type = 'button'; b.style.width = '100%';
    b.onclick = quizShowGuess;
    body.appendChild(b);
  }
  function quizShowGuess() {
    var a = quizAnswerer(), g = quizGuesser();
    var item = QUIZ_BANK[quiz.round];
    $('quiz-msg').textContent = nameOf(g) + ' — what did ' + nameOf(a) + ' pick?';
    var body = $('quiz-body'); body.innerHTML = '';
    body.appendChild(el('div', 'quiz-q', 'What is ' + nameOf(a) + '\u2019s ' + item.q + '?'));
    item.opts.forEach(function (opt, i) {
      var b = el('button', 'quiz-opt', opt);
      b.type = 'button';
      b.onclick = function () { quizReveal(i); };
      body.appendChild(b);
    });
    if (state.mode === 'bot' && g === 'p2') {
      later(function () { quizReveal(randInt(0, 2)); }, 900);
    }
  }
  function quizReveal(guess) {
    var a = quizAnswerer(), g = quizGuesser();
    var item = QUIZ_BANK[quiz.round];
    var correct = guess === quiz.secret;
    if (correct) quiz.points[g] += 1;
    $('quiz-msg').textContent = correct ? '✓ ' + nameOf(g) + ' KNOWS ' + nameOf(a) + '!' : '✗ Nope — ' + nameOf(a) + ' picked “' + item.opts[quiz.secret] + '”.';
    var body = $('quiz-body'); body.innerHTML = '';
    body.appendChild(el('p', 'tag center', 'Score — ' + nameOf('p1') + ': ' + quiz.points.p1 + ' · ' + nameOf('p2') + ': ' + quiz.points.p2));
    var b = el('button', 'btn primary', quiz.round >= 5 ? 'SEE QUIZ RESULT →' : 'NEXT ROUND →');
    b.type = 'button'; b.style.width = '100%';
    b.onclick = function () {
      quiz.round += 1;
      if (quiz.round >= 6) { endQuiz(); }
      else quizRoundPassAnswer();
    };
    body.appendChild(b);
  }
  function endQuiz() {
    if (!quiz || quiz.over) return;
    quiz.over = true;
    var winner = quiz.points.p1 === quiz.points.p2 ? 'tie' : (quiz.points.p1 > quiz.points.p2 ? 'p1' : 'p2');
    endGame(winner, 'Know Me: ' + quiz.points.p1 + '–' + quiz.points.p2 + ' correct guesses.');
  }

  // ---------- wiring ----------
  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.mode-btn').forEach(function (x) { x.classList.remove('selected'); });
      btn.classList.add('selected');
      state.mode = btn.getAttribute('data-mode');
      $('name-p2').disabled = state.mode === 'bot';
      $('mode-hint').textContent = state.mode === 'bot'
        ? 'Vs Bot: you play the bottom half (cyan). The bot plays the top half — reaction, taps, hockey, memory and quiz, all of it.'
        : 'Same phone: sit opposite each other, phone flat between you. P1 plays the top half, P2 the bottom half.';
      log('mode=' + state.mode);
    });
  });
  $('btn-start').addEventListener('click', startMatch);
  $('react-p1').addEventListener('pointerdown', function (e) { e.preventDefault(); reactTap(state.topPlayer); });
  $('react-p2').addEventListener('pointerdown', function (e) { e.preventDefault(); reactTap(state.bottomPlayer); });
  $('tap-p1').addEventListener('pointerdown', function (e) { e.preventDefault(); tapHit(state.topPlayer); });
  $('tap-p2').addEventListener('pointerdown', function (e) { e.preventDefault(); tapHit(state.bottomPlayer); });
  $('btn-quit').addEventListener('click', function () { clearGameTimers(); state.active = false; showScreen('screen-lobby'); });
  $('btn-rematch').addEventListener('click', startMatch);
  $('btn-final-lobby').addEventListener('click', function () { showScreen('screen-lobby'); });

  // hockey pointer wiring (attached once; hockey object is recreated per game)
  (function () {
    var cv = $('hockey-canvas');
    cv.addEventListener('pointerdown', function (e) {
      if (!hockey || hockey.over) return;
      e.preventDefault();
      var pos = hockeyPos(e);
      var side = pos.y < 260 ? 'top' : 'bottom';
      hockey.pointers[e.pointerId] = side;
      var p = side === 'top' ? hockey.top : hockey.bottom;
      p.x = pos.x; p.y = pos.y; clampPaddle(p, side);
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!hockey || hockey.over) return;
      var side = hockey.pointers[e.pointerId];
      if (!side) return;
      var pos = hockeyPos(e);
      var p = side === 'top' ? hockey.top : hockey.bottom;
      p.x = pos.x; p.y = pos.y; clampPaddle(p, side);
    });
    function release(e) { if (hockey) delete hockey.pointers[e.pointerId]; }
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
  })();

  window.__DUO__ = { state: state, GAMES: GAMES, startMatch: startMatch, version: '2.9.0' };
  log('duo clash 2.9.0 loaded');
})();
