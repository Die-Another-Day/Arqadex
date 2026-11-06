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
  var score = { p1: 0, p2: 0 }; // correct guesses

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

  // ---------- PEHCHAN KAUN: 6 rounds, answer about yourself, partner guesses ----------
  var QUIZ_BANK = [
    { q: 'favourite food', opts: ['Pizza', 'Biryani', 'Momos'] },
    { q: 'dream trip', opts: ['Goa beach', 'Mountains', 'Paris'] },
    { q: 'ideal date', opts: ['Movie night', 'Long drive', 'Cooking together'] },
    { q: 'superpower', opts: ['Teleport', 'Read minds', 'Time travel'] },
    { q: 'favourite movie vibe', opts: ['Action', 'Romance', 'Horror'] },
    { q: 'guilty pleasure', opts: ['Reality TV', 'Midnight snacks', 'Online shopping'] }
  ];
  var quiz = null;
  function beginGame() {
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
    if (correct) { quiz.points[g] += 1; score = { p1: quiz.points.p1, p2: quiz.points.p2 }; renderScore(); }
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
    score = { p1: quiz.points.p1, p2: quiz.points.p2 };
    renderScore();
    var winner = quiz.points.p1 === quiz.points.p2 ? 'tie' : (quiz.points.p1 > quiz.points.p2 ? 'p1' : 'p2');
    endMatch(winner, 'Pehchan Kaun: ' + quiz.points.p1 + '–' + quiz.points.p2 + ' sahi guesses.');
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

  window.__CHATPATA__ = { state: state, version: '2.12.0', game: 'pehchan-kaun' };
  log('pehchan-kaun 2.12.0 loaded');
})();
