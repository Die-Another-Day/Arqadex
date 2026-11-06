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
  var score = { p1: 0, p2: 0 }; // goals

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

  // ---------- HAWA HOCKEY: first to 3 goals, 60s cap ----------
  var hockey = null;
  function beginGame() {
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
    if (state.mode === 'bot') {
      var targetX = puck.y < 260 ? puck.x : 180;
      var targetY = puck.y < 260 ? Math.max(40, Math.min(220, puck.y - 20)) : 90;
      h.top.x += Math.max(-4.5, Math.min(4.5, targetX - h.top.x));
      h.top.y += Math.max(-4.5, Math.min(4.5, targetY - h.top.y));
    }
    puck.x += puck.vx; puck.y += puck.vy;
    puck.vx *= 0.995; puck.vy *= 0.995;
    if (puck.x < puck.r + 4) { puck.x = puck.r + 4; puck.vx = Math.abs(puck.vx); }
    if (puck.x > 356 - puck.r) { puck.x = 356 - puck.r; puck.vx = -Math.abs(puck.vx); }
    if (puck.y < 6) {
      if (puck.x > 120 && puck.x < 240) { goalScored(state.bottomPlayer); }
      else { puck.y = 6; puck.vy = Math.abs(puck.vy); }
    }
    if (puck.y > 514) {
      if (puck.x > 120 && puck.x < 240) { goalScored(state.topPlayer); }
      else { puck.y = 514; puck.vy = -Math.abs(puck.vy); }
    }
    [['top', h.top], ['bottom', h.bottom]].forEach(function (pair) {
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
    score = { p1: hockey.goals.p1, p2: hockey.goals.p2 };
    renderScore();
    updateHockeyScore();
    log('hockey goal ' + scorer + ' ' + JSON.stringify(hockey.goals));
    hockey.puck = { x: 180, y: 260, vx: rand(2, 3) * (Math.random() < 0.5 ? -1 : 1), vy: rand(2, 3), r: 11 };
    if (hockey.goals[scorer] >= 3) { endHockey(); return; }
    $('hockey-timer').textContent = 'GOAL! ' + nameOf(scorer) + ' scores · ' + hockey.timeLeft + 's left';
  }
  function endHockey() {
    if (!hockey || hockey.over) return;
    hockey.over = true;
    clearTimers();
    score = { p1: hockey.goals.p1, p2: hockey.goals.p2 };
    renderScore();
    var a = hockey.goals[state.topPlayer], b = hockey.goals[state.bottomPlayer];
    var winner = a === b ? 'tie' : (a > b ? state.topPlayer : state.bottomPlayer);
    later(function () { endMatch(winner, 'Hawa Hockey: ' + a + '–' + b + '.'); }, 800);
  }
  function drawHockey() {
    var ctx = hockey.ctx;
    ctx.clearRect(0, 0, 360, 520);
    ctx.fillStyle = '#070724'; ctx.fillRect(0, 0, 360, 520);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 352, 512);
    ctx.beginPath(); ctx.moveTo(4, 260); ctx.lineTo(356, 260); ctx.stroke();
    ctx.beginPath(); ctx.arc(180, 260, 52, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,45,166,.35)'; ctx.fillRect(120, 4, 120, 8);
    ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.fillRect(120, 508, 120, 8);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hockey.puck.x, hockey.puck.y, hockey.puck.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF2DA6'; ctx.beginPath(); ctx.arc(hockey.top.x, hockey.top.y, hockey.top.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050514'; ctx.beginPath(); ctx.arc(hockey.top.x, hockey.top.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00F5FF'; ctx.beginPath(); ctx.arc(hockey.bottom.x, hockey.bottom.y, hockey.bottom.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050514'; ctx.beginPath(); ctx.arc(hockey.bottom.x, hockey.bottom.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = 'bold 11px Orbitron, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(nameOf(state.topPlayer), 180, 30);
    ctx.save(); ctx.translate(180, 500); ctx.rotate(Math.PI); ctx.fillText(nameOf(state.bottomPlayer), 0, 0); ctx.restore();
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

  window.__CHATPATA__ = { state: state, version: '2.12.0', game: 'hawa-hockey' };
  log('hawa-hockey 2.12.0 loaded');
})();
