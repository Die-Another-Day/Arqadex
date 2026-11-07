import * as THREE from 'three';

// ============================================================================
// BUS YATRA — Indian Bus Simulator · v2.16.1
// Walk through a 3D Indian city, reach the bus stand, stand next to any bus
// and choose DRIVE or TRAVEL. Bot buses, real routes, and a radio that
// changes with the place. All music is ORIGINAL, composed in the style of
// old Bollywood — short catchy hooks, the way the viral parts play on a
// real bus. No copyrighted recordings.
// ============================================================================
(function () {
  'use strict';

  // ---------- theme: ?theme= wins, then the Arqadex shell theme, then the OS ----------
  (function applyTheme() {
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

  var $ = function (id) { return document.getElementById(id); };
  var DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';
  function log(msg) {
    if (!DEBUG) return;
    var d = $('debug-log');
    if (d) { d.classList.add('on'); d.textContent += msg + '\n'; d.scrollTop = d.scrollHeight; }
    console.log('[BUS YATRA]', msg);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ============================================================================
  // DATA — routes, buses, radio stations
  // ============================================================================
  var ROUTES = [
    { id: 'vad-ahd', name: 'VADODARA → AHMEDABAD', sub: 'Gujarat Express · 110 km', km: 110, length: 2600,
      station: 0, stops: ['ANAND', 'NADIAD', 'AHMEDABAD'],
      zones: ['VADODARA CITY', 'GUJARAT HIGHWAY', 'GREEN FIELDS', 'AHMEDABAD CITY'] },
    { id: 'mum-pun', name: 'MUMBAI → PUNE', sub: 'Deccan Queen · 150 km', km: 150, length: 3000,
      station: 2, stops: ['LONAVALA', 'KHANDALA', 'PUNE'],
      zones: ['MUMBAI CITY', 'WESTERN GHATS', 'HILL STATION', 'PUNE CITY'] },
    { id: 'del-jai', name: 'DELHI → JAIPUR', sub: 'Pink City Express · 280 km', km: 280, length: 3400,
      station: 1, stops: ['GURUGRAM', 'MANESAR', 'JAIPUR'],
      zones: ['DELHI CITY', 'ARAVALLI HIGHWAY', 'DESERT EDGE', 'JAIPUR CITY'] },
    { id: 'ahd-sur', name: 'AHMEDABAD → SURAT', sub: 'Diamond Express · 265 km', km: 265, length: 3300,
      station: 0, stops: ['NADIAD', 'VADODARA', 'SURAT'],
      zones: ['AHMEDABAD CITY', 'GUJARAT HIGHWAY', 'TEXTILE BELT', 'SURAT CITY'] },
    { id: 'vad-mum', name: 'VADODARA → MUMBAI', sub: 'Gateway Express · 410 km', km: 410, length: 3600,
      station: 2, stops: ['BHARUCH', 'SURAT', 'MUMBAI'],
      zones: ['VADODARA CITY', 'NARMADA CROSSING', 'COASTAL HIGHWAY', 'MUMBAI CITY'] },
    { id: 'jai-uda', name: 'JAIPUR → UDAIPUR', sub: 'Lake City Express · 390 km', km: 390, length: 3500,
      station: 1, stops: ['AJMER', 'RAJSAMAND', 'UDAIPUR'],
      zones: ['JAIPUR CITY', 'ARAVALLI HILLS', 'LAKE DISTRICT', 'UDAIPUR CITY'] },
    { id: 'blr-mys', name: 'BENGALURU → MYSURU', sub: 'Mysuru Express · 150 km', km: 150, length: 3000,
      station: 2, stops: ['RAMANAGARA', 'CHANNAPATNA', 'MYSURU'],
      zones: ['BENGALURU CITY', 'SILK CITY', 'CAUVERY BELT', 'MYSURU CITY'] },
    { id: 'hyd-vij', name: 'HYDERABAD → VIJAYAWADA', sub: 'Krishna Express · 275 km', km: 275, length: 3300,
      station: 3, stops: ['NALGONDA', 'SURYAPET', 'VIJAYAWADA'],
      zones: ['HYDERABAD CITY', 'TELANGANA PLAINS', 'KRISHNA RIVER', 'VIJAYAWADA CITY'] },
    { id: 'lko-kan', name: 'LUCKNOW → KANPUR', sub: 'Ganga Express · 90 km', km: 90, length: 2400,
      station: 0, stops: ['UNNAO', 'BANGARMAU', 'KANPUR'],
      zones: ['LUCKNOW CITY', 'AAM BAGH', 'GANGA BELT', 'KANPUR CITY'] },
    { id: 'bho-ind', name: 'BHOPAL → INDORE', sub: 'Malwa Express · 195 km', km: 195, length: 3100,
      station: 1, stops: ['SEHORE', 'DEWAS', 'INDORE'],
      zones: ['BHOPAL CITY', 'MALWA PLATEAU', 'DEWAS HILLS', 'INDORE CITY'] },
  ];
  var BUSES = [
    { id: 'lalpari', name: 'LAL PARI', sub: 'Ordinary City Bus · red', cat: 'CITY', color: 0xdc2626, stripe: 0xfacc15, topSpeed: 34, accel: 15, fare: 20, price: 0 },
    { id: 'rajdhani', name: 'RAJDHANI COACH', sub: 'Deluxe Intercity · blue', cat: 'INTERCITY', color: 0x2563eb, stripe: 0xe2e8f0, topSpeed: 46, accel: 19, fare: 30, price: 0 },
    { id: 'vintage', name: 'GAADI NO. 1', sub: 'Vintage Tourist · green-yellow', cat: 'TOURIST', color: 0x16a34a, stripe: 0xfacc15, topSpeed: 38, accel: 16, fare: 40, price: 0 },
    { id: 'state', name: 'STATE TRANSPORT', sub: 'Government Ordinary · orange', cat: 'GOVT', color: 0xea580c, stripe: 0xf8fafc, topSpeed: 36, accel: 15, fare: 25, price: 150 },
    { id: 'cityac', name: 'CITY AC', sub: 'AC City Bus · sky blue', cat: 'CITY AC', color: 0x0284c7, stripe: 0xf8fafc, topSpeed: 40, accel: 17, fare: 35, price: 200 },
    { id: 'tourist', name: 'TOURIST COACH', sub: 'Tourist · yellow', cat: 'TOURIST', color: 0xeab308, stripe: 0x111827, topSpeed: 42, accel: 17, fare: 50, price: 250 },
    { id: 'sleeper', name: 'AC SLEEPER', sub: 'Private Sleeper · teal', cat: 'SLEEPER', color: 0x0f766e, stripe: 0xfacc15, topSpeed: 44, accel: 18, fare: 60, price: 350 },
    { id: 'volvo', name: 'VOLVO LUXURY', sub: 'Volvo-style Luxury Coach · purple', cat: 'LUXURY', color: 0x6d28d9, stripe: 0xe2e8f0, topSpeed: 50, accel: 20, fare: 80, price: 500 },
  ];
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // Each station: a short catchy hook (the "viral part"), looped. Original tunes.
  var STATIONS = [
    { name: 'RETRO ROMANCE', bpm: 92, kind: 'romance',
      lead: [[76, .5], [74, .5], [72, .5], [74, .5], [76, 1], [79, .5], [76, .5], [74, 1], [72, .5], [74, .5], [76, 1], [79, 1], [81, .5], [79, .5], [76, 1], [74, 1]],
      bass: [45, 45, 41, 43], drone: [57, 64] },
    { name: 'GHAZAL-E-SHAM', bpm: 68, kind: 'ghazal',
      lead: [[69, 2], [72, 1], [76, 1], [74, 2], [72, 1], [71, 1], [69, 2], [67, 1], [69, 2], [72, 2], [71, 1], [69, 3]],
      bass: [45, 40, 45, 43], drone: [57, 62] },
    { name: 'DHOL FOLK', bpm: 128, kind: 'folk',
      lead: [[74, .25], [76, .25], [78, .25], [81, .25], [81, .25], [78, .25], [76, .25], [74, .5], [71, .25], [74, .25], [76, .25], [78, .5], [76, .25], [74, .25], [71, 1]],
      bass: [50, 50, 45, 47], drone: [62, 69] },
    { name: 'QAWWALI NIGHTS', bpm: 104, kind: 'qawwali',
      lead: [[69, .5], [72, .5], [74, .5], [76, .5], [74, .5], [72, .5], [69, 1], [67, .5], [69, .5], [72, 1], [74, .5], [76, 1], [74, .5], [72, .5], [71, 1], [69, 1]],
      bass: [45, 45, 48, 43], drone: [57, 64] },
  ];

  // ============================================================================
  // AUDIO — WebAudio radio + SFX. Everything synthesized, no audio files.
  // Louder mix in 2.15.0 (the 2.13.0 lead was too quiet to hear on a phone),
  // plus a music toggle and a visible beat indicator.
  // ============================================================================
  var AudioEngine = {
    ctx: null, master: null, radioGain: null, engineOsc: null, engineGain: null,
    station: 0, timer: null, nextNoteTime: 0, step: 0, started: false, musicOn: true,
    vol: 0.8, lastBeatAt: 0,
    progress: function () { return (this.step % 32) / 32; },
    init: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.value = this.musicOn ? 0.55 : 0;
      this.radioGain.connect(this.master);
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 42;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      var lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 320;
      this.engineOsc.connect(lp); lp.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
    },
    resume: function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    setMusic: function (on) {
      this.musicOn = on;
      if (this.radioGain) this.radioGain.gain.value = on ? 0.55 * this.vol : 0;
    },
    setVolume: function (v) {
      this.vol = clamp(v, 0, 1);
      if (this.radioGain) this.radioGain.gain.value = this.musicOn ? 0.55 * this.vol : 0;
    },
    setEngine: function (speed01) {
      if (!this.ctx) return;
      this.engineOsc.frequency.value = 42 + speed01 * 90;
      this.engineGain.gain.value = 0.012 + speed01 * 0.035;
    },
    note: function (freq, when, dur, type, vol, dest) {
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      o.connect(g); g.connect(dest || this.radioGain);
      o.start(when); o.stop(when + dur + 0.05);
    },
    thump: function (when, vol) {
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(55, when + 0.12);
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
      o.connect(g); g.connect(this.radioGain);
      o.start(when); o.stop(when + 0.2);
    },
    tick: function (when, vol) {
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = 1800;
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
      o.connect(g); g.connect(this.radioGain);
      o.start(when); o.stop(when + 0.06);
    },
    startRadio: function (stationIdx) {
      if (!this.ctx || this.started) return;
      this.started = true;
      this.station = stationIdx;
      this.step = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      var self = this;
      this.timer = setInterval(function () { self.schedule(); }, 90);
    },
    setStation: function (stationIdx) {
      this.station = stationIdx;
      this.step = 0;
      this.nextNoteTime = this.ctx ? this.ctx.currentTime + 0.05 : 0;
    },
    schedule: function () {
      if (!this.ctx) return;
      var st = STATIONS[this.station];
      var beat = 60 / st.bpm;
      var stepDur = beat / 2; // 8th notes
      // if we fell behind (background tab, slow frame), jump forward — never
      // schedule a burst of stale notes
      if (this.nextNoteTime < this.ctx.currentTime - 0.1) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }
      while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
        var t = this.nextNoteTime;
        var barPos = this.step % 8;
        if (this.step % 16 === 0) {
          var self = this;
          st.drone.forEach(function (m) { self.note(mf(m), t, beat * 8, 'sine', 0.035); });
        }
        if (barPos === 0 || barPos === 4) {
          this.thump(t, 0.28);
          var bassNote = st.bass[Math.floor(this.step / 8) % 4];
          this.note(mf(bassNote), t, beat * 1.2, 'sine', 0.14);
          this.lastBeatAt = Date.now();
        }
        if ((st.kind === 'folk' || st.kind === 'qawwali') && barPos % 2 === 1) this.tick(t, 0.05);
        if (st.kind === 'qawwali' && (barPos === 2 || barPos === 6)) this.tick(t, 0.07);
        var leadIdx = this.step % 32;
        var acc = 0;
        for (var i = 0; i < st.lead.length; i++) {
          var durSteps = st.lead[i][1] * 2;
          if (leadIdx === acc) {
            this.note(mf(st.lead[i][0]), t, durSteps * stepDur * 0.9, 'sawtooth', 0.09);
            this.lastBeatAt = Date.now();
          }
          acc += durSteps;
          if (acc > 32) break;
        }
        this.step++;
        this.nextNoteTime += stepDur;
      }
    },
    horn: function () {
      if (!this.ctx) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      [370, 466].forEach(function (f) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.06, t);
        g.gain.setValueAtTime(0.06, t + 0.35);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.5);
      });
    },
    ding: function () {
      if (!this.ctx) return;
      var t = this.ctx.currentTime;
      this.note(880, t, 0.15, 'sine', 0.14, this.master);
      this.note(1174, t + 0.12, 0.25, 'sine', 0.14, this.master);
    }
  };
  // resume audio on ANY tap — a suspended context is the usual reason
  // music "doesn't play" on phones
  window.addEventListener('pointerdown', function () { AudioEngine.resume(); });

  // ============================================================================
  // STATE
  // ============================================================================
  // ---- save / progression (localStorage) ----
  var SAVE_KEY = 'bus-yatra-save-v1';
  var save = { coins: 100, xp: 0, completed: [], owned: ['lalpari', 'rajdhani', 'vintage'], stand: ['lalpari', 'rajdhani', 'vintage'], totalPax: 0, totalKm: 0 };
  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        if (typeof d.coins === 'number') save.coins = d.coins;
        if (typeof d.xp === 'number') save.xp = d.xp;
        if (Array.isArray(d.completed)) save.completed = d.completed;
        if (Array.isArray(d.owned) && d.owned.length) save.owned = d.owned;
        if (Array.isArray(d.stand) && d.stand.length === 3) save.stand = d.stand;
        if (typeof d.totalPax === 'number') save.totalPax = d.totalPax;
        if (typeof d.totalKm === 'number') save.totalKm = d.totalKm;
      }
    } catch (e) { /* fresh save */ }
  }
  function persistSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage full/blocked */ }
  }
  function busById(id) { for (var i = 0; i < BUSES.length; i++) if (BUSES[i].id === id) return BUSES[i]; return BUSES[0]; }
  loadSave();

  var state = {
    role: null, routeIdx: 0, mode: 'lobby',
    timeOfDay: 'morning', weather: 'clear',
    gear: 'P', doorsOpen: false, indicator: 0, lightsOn: false, handbrake: false,
    seat: 0, ticketPaid: false,
    // walk
    px: 0, pz: 35, pHeading: 0, camYaw: 0, walkSpeed: 0,
    // drive
    speed: 0, steer: 0, x: 3.5, z: 0, heading: 0,
    fare: 0, passengers: 0, stopsServed: 0, startTime: 0, elapsed: 0, rideDist: 0,
    zone: -1, manualStation: false, camView: 0, fastForward: false,
    chosenBusIdx: 0,
  };
  var route = ROUTES[0];
  var busSpec = BUSES[0];
  var ZONE_STATIONS = [0, 2, 1, 3];

  // ============================================================================
  // THREE.JS WORLD
  // ============================================================================
  var renderer, scene, camera, clock;
  var playerBus = null, rideBus = null, parkedBuses = [], botBuses = [], cars = [];
  var passengersAtStops = [], stopGroups = [], npcs = [], colliders = [];
  var clouds = [], wheels = [];
  var playerMesh = null, playerLegL = null, playerLegR = null, walkCycle = 0;
  var headlight = null, headTarget = null, rainPoints = null, roadMat = null, sunLight = null, hemiLight = null;
  var keys = {};
  var joy = { x: 0, y: 0, active: false };
  var wheelDrag = { active: false, startX: 0, steer: 0 };
  var input = { gas: false, brake: false, rev: false, hb: false };
  var camOrbit = { active: false, lastX: 0 };

  function canvasTexture(draw, w, h) {
    var c = document.createElement('canvas');
    c.width = w || 256; c.height = h || 64;
    draw(c.getContext('2d'), c.width, c.height);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeBus(color, stripe, destText) {
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var stripeMat = new THREE.MeshLambertMaterial({ color: stripe });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x1a202c });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 7), bodyMat);
    body.position.y = 1.6;
    g.add(body);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.25, 7.1), stripeMat);
    roof.position.y = 2.7;
    g.add(roof);
    var band = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.35, 7.02), stripeMat);
    band.position.y = 1.05;
    g.add(band);
    var shield = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), darkMat);
    shield.position.set(0, 2.0, -3.51); shield.rotation.y = Math.PI;
    g.add(shield);
    [-1.31, 1.31].forEach(function (x) {
      var win = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.8), darkMat);
      win.position.set(x, 2.0, 0); win.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(win);
    });
    if (destText) {
      var tex = canvasTexture(function (ctx, w, h) {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#facc15'; ctx.font = 'bold 26px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(destText, w / 2, h / 2);
      }, 256, 48);
      var board = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.4),
        new THREE.MeshBasicMaterial({ map: tex }));
      board.position.set(0, 1.15, -3.52); board.rotation.y = Math.PI;
      g.add(board);
    }
    var headMat = new THREE.MeshBasicMaterial({ color: 0xfff7cc });
    var indMatL = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    var indMatR = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    [-0.85, 0.85].forEach(function (x) {
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), headMat);
      hl.position.set(x, 0.85, -3.55); g.add(hl);
      var tl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      tl.position.set(x, 0.85, 3.55); g.add(tl);
      // indicators (amber, front + rear, blink when on)
      var indF = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), x < 0 ? indMatL : indMatR);
      indF.position.set(x, 1.25, -3.55); g.add(indF);
      var indR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), x < 0 ? indMatL : indMatR);
      indR.position.set(x, 1.25, 3.55); g.add(indR);
    });
    // passenger door (left side, near the front) — slides open/closed
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 1.1),
      new THREE.MeshLambertMaterial({ color: 0x1a202c }));
    door.position.set(-1.32, 1.35, -1.6);
    g.add(door);
    g.userData.door = door;
    g.userData.headMat = headMat;
    g.userData.indMatL = indMatL;
    g.userData.indMatR = indMatR;
    var wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var wg = [];
    [[-1.2, -2.3], [1.2, -2.3], [-1.2, 2.3], [1.2, 2.3]].forEach(function (p) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(p[0], 0.45, p[1]);
      g.add(w); wg.push(w);
    });
    g.userData.wheels = wg;
    return g;
  }

  function makeCar(color) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.6),
      new THREE.MeshLambertMaterial({ color: color }));
    body.position.y = 0.55; g.add(body);
    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.8),
      new THREE.MeshLambertMaterial({ color: 0x1a202c }));
    cab.position.set(0, 1.05, -0.2); g.add(cab);
    var wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 10);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    [[-0.85, -1.2], [0.85, -1.2], [-0.85, 1.2], [0.85, 1.2]].forEach(function (p) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.32, p[1]); g.add(w);
    });
    return g;
  }

  function makePerson(shirtColor, skinColor) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: shirtColor }));
    body.position.y = 0.75; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshLambertMaterial({ color: skinColor || 0xd9a066 }));
    head.position.y = 1.35; g.add(head);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    var legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), legMat);
    legL.position.set(-0.12, 0.25, 0); g.add(legL);
    var legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), legMat);
    legR.position.set(0.12, 0.25, 0); g.add(legR);
    g.userData.legL = legL; g.userData.legR = legR;
    return g;
  }

  function makeTree() {
    var g = new THREE.Group();
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x7c4a21 }));
    trunk.position.y = 0.6; g.add(trunk);
    var top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8),
      new THREE.MeshLambertMaterial({ color: pick([0x16a34a, 0x15803d, 0x4d7c0f]) }));
    top.position.y = 2.2; g.add(top);
    return g;
  }

  function makeBuilding(w, h, d, color, signText) {
    var g = new THREE.Group();
    var box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: color }));
    box.position.y = h / 2; g.add(box);
    var winMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
    for (var f = 0; f < Math.floor(h / 2); f++) {
      for (var i = 0; i < Math.max(1, Math.floor(w / 2)); i++) {
        var win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), winMat);
        win.position.set(-w / 2 + 0.7 + i * 1.6, 1.2 + f * 1.8, d / 2 + 0.02);
        g.add(win);
      }
    }
    if (signText) {
      var tex = canvasTexture(function (ctx, w2, h2) {
        ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w2, h2);
        ctx.fillStyle = '#facc15'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(signText, w2 / 2, h2 / 2);
      }, 256, 64);
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 0.5, 4.5), 1.0),
        new THREE.MeshBasicMaterial({ map: tex }));
      sign.position.set(0, h - 0.6, d / 2 + 0.05);
      g.add(sign);
    }
    return g;
  }

  function makeStopSign(text) {
    var tex = canvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(0, 0, w, 14);
      ctx.fillStyle = '#111827'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
      ctx.fillText('BUS STOP', w / 2, 34);
      ctx.font = 'bold 20px monospace'; ctx.fillText(text, w / 2, 56);
    }, 256, 72);
    return new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.68),
      new THREE.MeshBasicMaterial({ map: tex }));
  }

  // ---- time of day + weather ----
  var WEATHER_CFG = {
    morning: { sky: 0x9fd8ef, sun: 1.4, sunPos: [40, 80, 30], hemi: 0.95, fogFar: 240 },
    afternoon: { sky: 0x7ec8f0, sun: 1.6, sunPos: [10, 100, 10], hemi: 1.0, fogFar: 240 },
    evening: { sky: 0xff9a56, sun: 0.9, sunPos: [-60, 25, 40], hemi: 0.6, fogFar: 200 },
    night: { sky: 0x0b1026, sun: 0.15, sunPos: [0, 60, -20], hemi: 0.25, fogFar: 160 },
  };
  function applyWeather() {
    if (!scene) return;
    var cfg = WEATHER_CFG[state.timeOfDay] || WEATHER_CFG.morning;
    var sky = cfg.sky, fogFar = cfg.fogFar;
    if (state.weather === 'rain') { sky = 0x8a97a3; fogFar = Math.min(fogFar, 140); }
    if (state.weather === 'fog') { sky = 0xb8c4cc; fogFar = 90; }
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(sky, 60, fogFar);
    if (sunLight) {
      sunLight.intensity = cfg.sun;
      sunLight.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);
    }
    if (hemiLight) hemiLight.intensity = cfg.hemi;
    if (roadMat) roadMat.color.setHex(state.weather === 'rain' ? 0x1f2937 : 0x2f3540);
    if (rainPoints) rainPoints.visible = state.weather === 'rain';
    state.lightsOn = state.timeOfDay === 'night' ? true : state.lightsOn;
  }

  function buildWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd8ef);
    scene.fog = new THREE.Fog(0x9fd8ef, 60, 240);
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
    camera.position.set(0, 6, 44);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    $('game-root').appendChild(renderer.domElement);

    hemiLight = new THREE.HemisphereLight(0xcfe8ff, 0x8a7a5a, 0.95);
    scene.add(hemiLight);
    sunLight = new THREE.DirectionalLight(0xfff2cc, 1.4);
    sunLight.position.set(40, 80, 30);
    scene.add(sunLight);
    // headlight spotlight (attached to the active bus when lights are on)
    headlight = new THREE.SpotLight(0xfff2cc, 0, 60, 0.5, 0.4, 1.2);
    headTarget = new THREE.Object3D();
    scene.add(headTarget);
    headlight.target = headTarget;
    scene.add(headlight);
    // rain particles (hidden unless weather is rain)
    var rainGeo = new THREE.BufferGeometry();
    var rainPos = new Float32Array(600 * 3);
    for (var ri = 0; ri < 600; ri++) {
      rainPos[ri * 3] = rand(-40, 40);
      rainPos[ri * 3 + 1] = rand(0, 30);
      rainPos[ri * 3 + 2] = rand(-40, 40);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    rainPoints = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x9db8cc, size: 0.35, transparent: true, opacity: 0.7 }));
    rainPoints.visible = false;
    scene.add(rainPoints);

    var L = route.length;
    // ground — fields
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(700, L + 600),
      new THREE.MeshLambertMaterial({ color: 0x7fae5a }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, -L / 2);
    scene.add(ground);
    // route road (continues through the city)
    roadMat = new THREE.MeshLambertMaterial({ color: 0x2f3540 });
    var road = new THREE.Mesh(new THREE.PlaneGeometry(14, L + 400), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -L / 2 + 100);
    scene.add(road);
    var dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (var z = 100; z > -L - 200; z -= 10) {
      var dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.01, z);
      scene.add(dash);
    }
    [-6.8, 6.8].forEach(function (x) {
      var edge = new THREE.Mesh(new THREE.PlaneGeometry(0.25, L + 400),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.01, -L / 2 + 100);
      scene.add(edge);
    });

    // ---- CITY around the bus stand (z from -8 to +48, x -38..38) ----
    var plaza = new THREE.Mesh(new THREE.PlaneGeometry(76, 56),
      new THREE.MeshLambertMaterial({ color: 0xb8b0a0 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 20);
    scene.add(plaza);
    // cross street
    var cross = new THREE.Mesh(new THREE.PlaneGeometry(76, 10),
      new THREE.MeshLambertMaterial({ color: 0x2f3540 }));
    cross.rotation.x = -Math.PI / 2;
    cross.position.set(0, 0.03, 30);
    scene.add(cross);
    // shops around the plaza (with colliders)
    var shops = [
      { x: -20, z: 14, w: 8, h: 5, d: 6, c: 0xf59e0b, sign: 'CHAI ☕' },
      { x: -20, z: 26, w: 8, h: 6, d: 6, c: 0xec4899, sign: 'SWEETS' },
      { x: -20, z: 40, w: 8, h: 4, d: 6, c: 0x06b6d4, sign: 'MOBILE' },
      { x: 20, z: 14, w: 8, h: 5, d: 6, c: 0x8b5cf6, sign: 'DHABA' },
      { x: 20, z: 26, w: 8, h: 7, d: 6, c: 0xf97316, sign: 'PAN SHOP' },
      { x: 20, z: 40, w: 8, h: 4, d: 6, c: 0x14b8a6, sign: 'GENERAL' },
      { x: -28, z: 34, w: 7, h: 9, d: 7, c: 0x64748b, sign: '' },
      { x: 28, z: 34, w: 7, h: 11, d: 7, c: 0x475569, sign: '' },
      { x: 0, z: 46, w: 10, h: 8, d: 6, c: 0xdc2626, sign: 'CINEMA' },
    ];
    shops.forEach(function (s) {
      var b = makeBuilding(s.w, s.h, s.d, s.c, s.sign);
      b.position.set(s.x, 0, s.z);
      scene.add(b);
      colliders.push({ x: s.x, z: s.z, hw: s.w / 2, hd: s.d / 2 });
    });
    // trees + streetlights in the city
    for (var ti = 0; ti < 8; ti++) {
      var tr = makeTree();
      var tx = ti % 2 === 0 ? -13 : 13;
      tr.position.set(tx, 0, 8 + Math.floor(ti / 2) * 9);
      scene.add(tr);
      colliders.push({ x: tx, z: 8 + Math.floor(ti / 2) * 9, hw: 0.5, hd: 0.5 });
    }
    for (var li = 0; li < 4; li++) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.5, 6),
        new THREE.MeshLambertMaterial({ color: 0x334155 }));
      var lx = li % 2 === 0 ? -8.5 : 8.5;
      var lz = 10 + Math.floor(li / 2) * 24;
      pole.position.set(lx, 2.25, lz);
      scene.add(pole);
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfde68a }));
      lamp.position.set(lx, 4.6, lz);
      scene.add(lamp);
    }

    // ---- BUS STAND: roof, bays, 3 parked buses ----
    var roof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 12),
      new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }));
    roof.position.set(0, 3.8, 5);
    scene.add(roof);
    [[-11, -0.5], [11, -0.5], [-11, 10.5], [11, 10.5]].forEach(function (p) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8, 6),
        new THREE.MeshLambertMaterial({ color: 0x475569 }));
      post.position.set(p[0], 1.9, p[1]);
      scene.add(post);
      colliders.push({ x: p[0], z: p[1], hw: 0.3, hd: 0.3 });
    });
    var standTex = canvasTexture(function (ctx, w, h) {
      ctx.fillStyle = '#e10600'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('BUS STAND', w / 2, h / 2);
    }, 512, 96);
    var standSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.9),
      new THREE.MeshBasicMaterial({ map: standTex }));
    standSign.position.set(0, 4.9, -0.6);
    scene.add(standSign);
    // benches
    [-6, 6].forEach(function (x) {
      var bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x92400e }));
      bench.position.set(x, 0.4, 10);
      scene.add(bench);
      colliders.push({ x: x, z: 10, hw: 1.6, hd: 0.5 });
    });
    // parked buses in bays — the 3 from the player's garage
    var bayX = [-7, 0, 7];
    save.stand.forEach(function (busId, i) {
      var bs = busById(busId);
      var bus = makeBus(bs.color, bs.stripe, route.name);
      bus.position.set(bayX[i], 0, 5);
      scene.add(bus);
      parkedBuses.push({ spec: bs, mesh: bus, x: bayX[i], z: 5, taken: false });
      colliders.push({ x: bayX[i], z: 5, hw: 1.5, hd: 3.7, bus: true, ref: parkedBuses[i] });
    });

    // ---- landmarks along the route (fixed fractions, never on the road) ----
    function landmark(kind, z) {
      var grp = new THREE.Group();
      if (kind === 'petrol') {
        var canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 7),
          new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
        canopy.position.y = 4.5; grp.add(canopy);
        [[-4, -3], [4, -3], [-4, 3], [4, 3]].forEach(function (pp) {
          var pil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 6),
            new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
          pil.position.set(pp[0], 2.25, pp[1]); grp.add(pil);
        });
        var pump = new THREE.Mesh(new THREE.BoxGeometry(1, 1.6, 0.6),
          new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
        pump.position.set(0, 0.8, 0); grp.add(pump);
      } else if (kind === 'toll') {
        var gantry = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x334155 }));
        gantry.position.y = 6; grp.add(gantry);
        [-9, 9].forEach(function (x) {
          var leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x334155 }));
          leg.position.set(x, 3, 0); grp.add(leg);
          var booth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 2),
            new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
          booth.position.set(x * 0.7, 1.2, 2.5); grp.add(booth);
        });
      } else if (kind === 'temple') {
        var base = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 6),
          new THREE.MeshLambertMaterial({ color: 0xf5d0a9 }));
        base.position.y = 2; grp.add(base);
        var dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
        dome.position.y = 4; grp.add(dome);
        var flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));
        flag.position.set(0, 7.2, 0); grp.add(flag);
      } else if (kind === 'railway') {
        var barrier = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 0.25),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
        barrier.position.y = 1.2; grp.add(barrier);
        var post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 0.3),
          new THREE.MeshLambertMaterial({ color: 0x111827 }));
        post.position.set(-4, 1.2, 0); grp.add(post);
        var crossSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }));
        crossSign.position.set(4.5, 2.5, 0); grp.add(crossSign);
      }
      grp.position.set(16, 0, z);
      scene.add(grp);
    }
    landmark('petrol', -L * 0.25);
    landmark('toll', -L * 0.4);
    landmark('temple', -L * 0.6);
    landmark('railway', -L * 0.75);

    // ---- route scenery (z < 0) ----
    var colors = [0xf59e0b, 0xec4899, 0x06b6d4, 0x8b5cf6, 0xf97316, 0x14b8a6];
    for (var sz = -60; sz > -L - 100; sz -= 90) {
      var side = Math.random() < 0.5 ? -1 : 1;
      var kind = Math.random();
      if (kind < 0.4) {
        var b = makeBuilding(rand(5, 9), rand(4, 11), rand(5, 8), pick(colors));
        b.position.set(side * rand(14, 30), 0, sz + rand(-20, 20));
        scene.add(b);
      } else if (kind < 0.75) {
        for (var tj = 0; tj < 3; tj++) {
          var tr2 = makeTree();
          tr2.position.set(side * rand(10, 26), 0, sz + rand(-30, 30));
          scene.add(tr2);
        }
      } else {
        var shop = new THREE.Group();
        var hut = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4),
          new THREE.MeshLambertMaterial({ color: pick(colors) }));
        hut.position.y = 1.5; shop.add(hut);
        var awn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.15, 2),
          new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
        awn.position.set(0, 2.6, 2.4); awn.rotation.x = 0.25; shop.add(awn);
        shop.position.set(side * rand(13, 20), 0, sz);
        scene.add(shop);
      }
      if (Math.abs(sz % 300) < 45) {
        var ms = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.3),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
        ms.position.set(7.6, 0.5, sz);
        scene.add(ms);
      }
    }
    for (var mi = 0; mi < 14; mi++) {
      var m = new THREE.Mesh(new THREE.ConeGeometry(rand(30, 60), rand(40, 90), 7),
        new THREE.MeshLambertMaterial({ color: 0x64748b }));
      m.position.set((mi % 2 === 0 ? -1 : 1) * rand(120, 220), 0, -mi * (L / 14) + 50);
      scene.add(m);
    }
    for (var ci = 0; ci < 10; ci++) {
      var cl = new THREE.Group();
      for (var cj = 0; cj < 4; cj++) {
        var s = new THREE.Mesh(new THREE.SphereGeometry(rand(3, 6), 8, 8),
          new THREE.MeshLambertMaterial({ color: 0xffffff }));
        s.position.set(cj * 4 - 6, rand(-1, 1), rand(-2, 2));
        cl.add(s);
      }
      cl.position.set(rand(-120, 120), rand(35, 55), -Math.random() * L);
      scene.add(cl);
      clouds.push(cl);
    }
    var ads = ['ARQADEX — PLAY INSTANTLY', 'CHAI ☕ 10 Rs', 'DHABA — DAL FRY', 'BUS YATRA'];
    for (var bi = 0; bi < 5; bi++) {
      var txt = ads[bi % ads.length];
      var tex = canvasTexture(function (ctx, w, h) {
        ctx.fillStyle = '#e10600'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, w / 2, h / 2);
      }, 512, 128);
      var bb = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5),
        new THREE.MeshBasicMaterial({ map: tex }));
      var bz = -200 - bi * (L / 5);
      bb.position.set((bi % 2 === 0 ? -1 : 1) * 16, 4, bz);
      bb.rotation.y = bi % 2 === 0 ? 0.4 : -0.4 + Math.PI;
      scene.add(bb);
      var pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 6),
        new THREE.MeshLambertMaterial({ color: 0x475569 }));
      pole2.position.set(bb.position.x, 1.5, bz);
      scene.add(pole2);
    }
    // bus stops on the route
    route.stops.forEach(function (name, i) {
      var z;
      if (i === route.stops.length - 1) z = -route.length * 0.92;
      else z = -route.length * ((i + 1) / route.stops.length) * 0.85;
      var stop = new THREE.Group();
      var shelter = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 2.5),
        new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }));
      shelter.position.y = 3; stop.add(shelter);
      [-2.2, 2.2].forEach(function (x) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6),
          new THREE.MeshLambertMaterial({ color: 0x475569 }));
        post.position.set(x, 1.5, 0); stop.add(post);
      });
      var sign = makeStopSign(name);
      sign.position.set(0, 2.2, 0);
      stop.add(sign);
      stop.position.set(9.5, 0, z);
      scene.add(stop);
      stopGroups.push(stop);
      var n = 2 + Math.floor(Math.random() * 3);
      var group = [];
      for (var pi = 0; pi < n; pi++) {
        var pax = makePerson(pick([0xef4444, 0x3b82f6, 0xf59e0b, 0xec4899, 0x22c55e]));
        pax.position.set(9.5 + rand(-1.5, 1.5), 0, z + rand(-2, 2));
        scene.add(pax);
        group.push(pax);
      }
      passengersAtStops.push({ z: z, name: name, people: group, served: false });
    });

    // walking NPCs on the sidewalks
    for (var ni = 0; ni < 6; ni++) {
      var npc = makePerson(pick([0xef4444, 0x3b82f6, 0xf59e0b, 0xec4899, 0x22c55e, 0x8b5cf6]));
      var nx = ni % 2 === 0 ? -10.5 : 10.5;
      npc.position.set(nx, 0, rand(0, 45));
      scene.add(npc);
      npcs.push({ mesh: npc, x: nx, z: npc.position.z, dir: Math.random() < 0.5 ? 1 : -1, speed: rand(1, 2), phase: rand(0, 6) });
    }

    // player figure
    playerMesh = makePerson(0xFF2DA6);
    playerMesh.position.set(state.px, 0, state.pz);
    scene.add(playerMesh);
    playerLegL = playerMesh.userData.legL;
    playerLegR = playerMesh.userData.legR;

    // bot buses + cars on the route
    var botColors = [0x0ea5e9, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x14b8a6];
    for (var b = 0; b < 5; b++) {
      var bb = makeBus(botColors[b % botColors.length], 0xf8fafc, 'CITY BUS');
      var lane = b % 2 === 0 ? 3.5 : -3.5;
      var dir = lane > 0 ? -1 : 1;
      bb.position.set(lane, 0, -Math.random() * route.length);
      scene.add(bb);
      botBuses.push({ mesh: bb, lane: lane, dir: dir, speed: rand(14, 22), kind: 'bus' });
    }
    for (var c = 0; c < 6; c++) {
      var car = makeCar(pick([0xef4444, 0xfacc15, 0x3b82f6, 0xf8fafc, 0x111827]));
      var lane2 = c % 2 === 0 ? 3.5 : -3.5;
      var dir2 = lane2 > 0 ? -1 : 1;
      car.position.set(lane2, 0, -Math.random() * route.length);
      scene.add(car);
      cars.push({ mesh: car, lane: lane2, dir: dir2, speed: rand(24, 34), kind: 'car' });
    }
    // autos (3-wheelers) + bikes — the real Indian road
    for (var a = 0; a < 3; a++) {
      var auto = new THREE.Group();
      var abody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 2.2),
        new THREE.MeshLambertMaterial({ color: pick([0xfacc15, 0x16a34a, 0x111827]) }));
      abody.position.y = 0.6; auto.add(abody);
      var acan = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 2.3),
        new THREE.MeshLambertMaterial({ color: 0x111827 }));
      acan.position.y = 1.35; auto.add(acan);
      var aw = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10),
        new THREE.MeshLambertMaterial({ color: 0x111111 }));
      aw.rotation.z = Math.PI / 2; aw.position.set(0, 0.28, -0.9); auto.add(aw);
      var laneA = a % 2 === 0 ? 3.5 : -3.5;
      auto.position.set(laneA, 0, -Math.random() * route.length);
      scene.add(auto);
      cars.push({ mesh: auto, lane: laneA, dir: laneA > 0 ? -1 : 1, speed: rand(16, 22), kind: 'auto' });
    }
    for (var bk = 0; bk < 2; bk++) {
      var bike = new THREE.Group();
      var rider = makePerson(pick([0xef4444, 0x3b82f6, 0xf59e0b]));
      rider.scale.set(0.9, 0.9, 0.9);
      rider.position.y = 0.35;
      bike.add(rider);
      var laneB = bk % 2 === 0 ? 1.5 : -1.5;
      bike.position.set(laneB, 0, -Math.random() * route.length);
      scene.add(bike);
      cars.push({ mesh: bike, lane: laneB, dir: laneB > 0 ? -1 : 1, speed: rand(26, 36), kind: 'bike' });
    }
    applyWeather();

    clock = new THREE.Clock();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      checkOrientation();
    });
    log('world built: route=' + route.name + ' length=' + route.length);
  }

  // ============================================================================
  // LOBBY
  // ============================================================================
  function buildLobby() {
    var rl = $('route-list');
    rl.innerHTML = '';
    ROUTES.forEach(function (r, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (i === state.routeIdx ? ' selected' : '');
      var done = save.completed.indexOf(r.id) >= 0 ? ' ✅ DONE' : '';
      b.innerHTML = '<span><b>' + r.name + '</b><i>' + r.sub + ' · Stops: ' + r.stops.join(' → ') + '</i></span><span class="pill">' + r.km + ' KM' + done + '</span>';
      b.onclick = function () {
        state.routeIdx = i; route = ROUTES[i];
        rl.querySelectorAll('.pick').forEach(function (el) { el.classList.remove('selected'); });
        b.classList.add('selected');
      };
      rl.appendChild(b);
    });
    $('time-row').querySelectorAll('.mode-btn').forEach(function (btn) {
      btn.onclick = function () {
        state.timeOfDay = btn.dataset.time;
        $('time-row').querySelectorAll('.mode-btn').forEach(function (el) { el.classList.remove('selected'); });
        btn.classList.add('selected');
      };
    });
    $('weather-row').querySelectorAll('.mode-btn').forEach(function (btn) {
      btn.onclick = function () {
        state.weather = btn.dataset.weather;
        $('weather-row').querySelectorAll('.mode-btn').forEach(function (el) { el.classList.remove('selected'); });
        btn.classList.add('selected');
      };
    });
    renderGarage();
    updateSaveBar();
    $('btn-start').onclick = enterCity;
    $('btn-again').onclick = function () {
      $('screen-end').classList.add('hidden');
      enterCity();
    };
    $('btn-lobby').onclick = function () {
      $('screen-end').classList.add('hidden');
      $('screen-lobby').classList.remove('hidden');
      state.mode = 'lobby';
      buildLobby();
    };
  }

  function updateSaveBar() {
    $('save-coins').textContent = String(save.coins);
    $('save-xp').textContent = String(save.xp);
    $('save-routes').textContent = String(save.completed.length);
    var hc = $('hud-coins');
    if (hc) hc.textContent = String(save.coins);
  }

  function renderGarage() {
    var gl = $('garage-list');
    gl.innerHTML = '';
    BUSES.forEach(function (bs) {
      var owned = save.owned.indexOf(bs.id) >= 0;
      var atStand = save.stand.indexOf(bs.id) >= 0;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (atStand ? ' selected' : '') + (owned ? '' : ' locked');
      var pill = owned ? (atStand ? 'AT STAND ✓' : 'OWNED — TAP TO PARK') : '🔒 ' + bs.price + ' COINS';
      b.innerHTML = '<span><b>' + bs.name + '</b><i>' + bs.sub + ' · Top ' + Math.round(bs.topSpeed * 2.2) + ' km/h · ₹' + bs.fare + '/head</i></span><span class="pill' + (owned ? '' : ' lock') + '">' + pill + '</span>';
      b.onclick = function () {
        if (owned) {
          if (atStand) return;
          save.stand[2] = bs.id; // swap into the third bay
          persistSave();
          renderGarage();
          setMsg(bs.name + ' is now parked at the stand.');
        } else if (save.coins >= bs.price) {
          save.coins -= bs.price;
          save.owned.push(bs.id);
          save.stand[2] = bs.id;
          persistSave();
          renderGarage();
          updateSaveBar();
          setMsg('🎉 ' + bs.name + ' unlocked and parked at the stand!');
        } else {
          setMsg('Not enough coins for ' + bs.name + ' — drive routes to earn!');
        }
      };
      gl.appendChild(b);
    });
  }

  // ============================================================================
  // GAME FLOW
  // ============================================================================
  var boarding = null;
  var lastCollide = 0;
  var nearBus = null; // parked bus the player is standing next to

  function enterCity() {
    AudioEngine.init();
    AudioEngine.resume();
    route = ROUTES[state.routeIdx];
    ZONE_STATIONS = [route.station, 2, 1, 3];
    if (renderer) {
      renderer.dispose();
      var root = $('game-root');
      while (root.firstChild) root.removeChild(root.firstChild);
    }
    botBuses = []; cars = []; passengersAtStops = []; stopGroups = []; npcs = [];
    colliders = []; parkedBuses = []; clouds = [];
    playerBus = null; rideBus = null; nearBus = null;
    state.speed = 0; state.steer = 0; state.x = 3.5; state.z = 0; state.heading = 0;
    state.fare = 0; state.passengers = 0; state.stopsServed = 0; state.rideDist = 0;
    state.zone = -1; state.manualStation = false; state.camView = 0; state.fastForward = false;
    state.px = 0; state.pz = 35; state.pHeading = 0; state.camYaw = 0; state.walkSpeed = 0;
    state.startTime = performance.now(); state.elapsed = 0;
    boarding = null;
    buildWorld();
    state.mode = 'walk';
    $('screen-lobby').classList.add('hidden');
    $('screen-end').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('joystick').classList.remove('hidden');
    $('drive-controls').classList.add('hidden');
    $('hud-drive-row').classList.add('hidden');
    $('music-panel').classList.add('hidden');
    $('ticket-panel').classList.add('hidden');
    $('seat-panel').classList.add('hidden');
    $('touch-passenger').classList.add('hidden');
    $('bus-prompt').classList.add('hidden');
    state.doorsOpen = false; state.indicator = 0; state.handbrake = false;
    state.lightsOn = state.timeOfDay === 'night';
    state.seat = 0; state.ticketPaid = false;
    $('hud-route').textContent = route.name;
    $('hud-stop').textContent = 'WALK TO A BUS AT THE STAND';
    setMsg('Welcome to ' + route.name.split(' ')[0] + '! Walk to the bus stand 🚶');
    if (AudioEngine.started) AudioEngine.setStation(route.station);
    else AudioEngine.startRadio(route.station);
    updateStationLabel();
    updateMusicButton();
    checkOrientation();
    log('enter city role=walk route=' + route.id);
  }

  function setMsg(m) { $('hud-msg').textContent = m; }
  function updateStationLabel() { $('hud-station').textContent = STATIONS[AudioEngine.station].name; }
  function updateMusicButton() {
    $('hud-music').textContent = AudioEngine.musicOn ? 'MUSIC ON' : 'MUSIC OFF';
    $('btn-music').classList.toggle('playing', AudioEngine.musicOn);
  }

  function showEnd(title, line, rows) {
    state.mode = 'end';
    $('hud').classList.add('hidden');
    $('joystick').classList.add('hidden');
    $('drive-controls').classList.add('hidden');
    $('hud-drive-row').classList.add('hidden');
    $('music-panel').classList.add('hidden');
    $('ticket-panel').classList.add('hidden');
    $('seat-panel').classList.add('hidden');
    $('touch-passenger').classList.add('hidden');
    $('bus-prompt').classList.add('hidden');
    $('end-title').textContent = title;
    $('end-line').textContent = line;
    $('end-stats').innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('');
    $('screen-end').classList.remove('hidden');
    AudioEngine.ding();
    log('end: ' + title);
  }

  function endYatra(reason) {
    // ---- progression rewards ----
    var earned = 0, xpGain = 0;
    if (state.role === 'driver') {
      earned = state.fare;
      xpGain = state.fare + state.stopsServed * 10;
      save.totalPax += state.passengers;
      save.totalKm += route.km;
    } else {
      earned = 50;
      xpGain = Math.round((state.rideDist || 0)) * 2;
      save.totalKm += Math.round(state.rideDist || 0);
    }
    save.coins += earned;
    save.xp += xpGain;
    if (save.completed.indexOf(route.id) < 0) save.completed.push(route.id);
    persistSave();
    updateSaveBar();
    var mins = Math.floor(state.elapsed / 60);
    var secs = Math.floor(state.elapsed % 60);
    var timeStr = mins + ':' + String(secs).padStart(2, '0');
    if (state.role === 'driver') {
      showEnd(reason === 'done' ? 'MANZIL AA GAYI! 🎉' : 'YATRA KHATAM',
        reason === 'done'
          ? 'You reached ' + route.stops[route.stops.length - 1] + ' with ₹' + state.fare + ' fare. Shabaash, ustaad!'
          : 'Yatra ended midway — ' + state.passengers + ' passengers rode with you.',
        [['ROLE', 'DRIVER · ' + busSpec.name], ['ROUTE', route.name], ['FARE COLLECTED', '₹' + state.fare],
         ['PASSENGERS', String(state.passengers)], ['STOPS SERVED', state.stopsServed + ' / ' + route.stops.length],
         ['COINS EARNED', '+' + earned + ' 🪙  (+' + xpGain + ' XP)'],
         ['TIME', timeStr]]);
    } else {
      var km = (state.rideDist || 0).toFixed(1);
      showEnd('UTAR GAYE! 👋',
        'You travelled ' + km + ' km as a passenger. Kaisi lagi yatra?',
        [['ROLE', 'PASSENGER · ' + busSpec.name], ['ROUTE', route.name], ['DISTANCE RODE', km + ' km'],
         ['STOPS PASSED', String(state.stopsServed)],
         ['COINS EARNED', '+' + earned + ' 🪙  (+' + xpGain + ' XP)'],
         ['TIME', timeStr]]);
    }
  }

  // choose a parked bus: drive it or ride it
  function chooseBus(parked, asDriver) {
    busSpec = parked.spec;
    state.chosenBusIdx = BUSES.indexOf(parked.spec);
    parked.taken = true;
    // remove the other parked buses' colliders (they stay parked, just not chosen)
    playerMesh.visible = false;
    $('bus-prompt').classList.add('hidden');
    $('joystick').classList.add('hidden');
    nearBus = null;
    state.startTime = performance.now();
    if (asDriver) {
      state.role = 'driver';
      playerBus = parked.mesh;
      state.x = parked.x; state.z = parked.z; state.heading = 0; state.speed = 0;
      state.doorsOpen = false; state.indicator = 0; state.handbrake = false;
      state.lightsOn = state.timeOfDay === 'night';
      wheels = playerBus.userData.wheels;
      state.mode = 'driving';
      $('drive-controls').classList.remove('hidden');
      $('hud-drive-row').classList.remove('hidden');
      updateDriveButtons();
      setMsg('Chalo! ' + busSpec.name + ' is yours. Next stop: ' + route.stops[0]);
    } else {
      // traveller: buy a ticket, then pick a seat
      state.role = 'passenger';
      state.ticketPaid = false;
      state.pendingBus = parked;
      $('ticket-info').textContent = busSpec.name + ' · ' + route.name + ' · Fare ₹' + busSpec.fare;
      $('ticket-note').textContent = 'Your coins: ' + save.coins + (save.coins < busSpec.fare ? ' — not enough? Drive a route to earn coins.' : '');
      $('btn-buy-ticket').disabled = save.coins < busSpec.fare;
      $('btn-buy-ticket').textContent = save.coins < busSpec.fare ? 'NOT ENOUGH COINS' : 'BUY TICKET — ₹' + busSpec.fare;
      $('bus-prompt').classList.add('hidden');
      $('ticket-panel').classList.remove('hidden');
      setMsg('🎫 Buy your ticket for the ' + busSpec.name + '.');
    }
    state.camView = 0;
    updateCamButton();
    log('choose bus ' + busSpec.id + ' as ' + state.role);
  }

  // ---- ticket + seat selection ----
  var SEATS = [
    { label: '1A', pos: 'WINDOW', off: [-0.8, 1.9, -2.0] },
    { label: '1B', pos: 'WINDOW', off: [0.8, 1.9, -2.0] },
    { label: '2A', pos: 'WINDOW', off: [-0.8, 1.9, 0] },
    { label: '2B', pos: 'WINDOW', off: [0.8, 1.9, 0] },
    { label: '3A', pos: 'AISLE', off: [-0.4, 1.9, 0.8] },
    { label: '3B', pos: 'AISLE', off: [0.4, 1.9, 0.8] },
    { label: '4A', pos: 'WINDOW', off: [-0.8, 1.9, 2.4] },
    { label: '4B', pos: 'WINDOW', off: [0.8, 1.9, 2.4] },
  ];
  var selectedSeat = 0;
  function boardAsPassenger() {
    var parked = state.pendingBus;
    if (!parked) return;
    rideBus = { mesh: parked.mesh, lane: 3.5, dir: -1, speed: 0, kind: 'bus', halt: null };
    rideBus.mesh.position.set(3.5, 0, parked.z);
    playerMesh.visible = false;
    $('seat-panel').classList.add('hidden');
    $('ticket-panel').classList.add('hidden');
    state.mode = 'passenger';
    $('touch-passenger').classList.remove('hidden');
    setMsg('💺 Seated in ' + SEATS[state.seat].label + ' (' + SEATS[state.seat].pos + '). Enjoy the yatra!');
    state.camView = 0;
    updateCamButton();
    log('boarded as passenger, seat ' + SEATS[state.seat].label);
  }
  $('btn-buy-ticket').onclick = function () {
    if (save.coins < busSpec.fare) return;
    save.coins -= busSpec.fare;
    state.ticketPaid = true;
    persistSave();
    updateSaveBar();
    $('ticket-panel').classList.add('hidden');
    // seat map
    var grid = $('seat-grid');
    grid.innerHTML = '';
    selectedSeat = 0;
    SEATS.forEach(function (seat, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'seat' + (i === 0 ? ' sel' : '');
      b.innerHTML = seat.label + '<small>' + seat.pos + '</small>';
      b.onclick = function () {
        selectedSeat = i;
        grid.querySelectorAll('.seat').forEach(function (el) { el.classList.remove('sel'); });
        b.classList.add('sel');
      };
      grid.appendChild(b);
    });
    $('seat-panel').classList.remove('hidden');
    setMsg('🎫 Ticket bought! Now pick your seat.');
  };
  $('btn-no-ticket').onclick = function () {
    $('ticket-panel').classList.add('hidden');
    $('bus-prompt').classList.remove('hidden');
  };
  $('btn-sit').onclick = function () {
    state.seat = selectedSeat;
    boardAsPassenger();
  };

  // ============================================================================
  // WALK MODE
  // ============================================================================
  function collide(px, pz, r) {
    // city bounds
    px = clamp(px, -38, 38);
    pz = clamp(pz, -8, 48);
    // AABB push-out
    for (var i = 0; i < colliders.length; i++) {
      var c = colliders[i];
      if (c.bus && c.ref && c.ref.taken) continue; // chosen bus is gone from the stand
      var dx = px - c.x, dz = pz - c.z;
      var ox = c.hw + r - Math.abs(dx), oz = c.hd + r - Math.abs(dz);
      if (ox > 0 && oz > 0) {
        if (ox < oz) px = c.x + (dx > 0 ? 1 : -1) * (c.hw + r);
        else pz = c.z + (dz > 0 ? 1 : -1) * (c.hd + r);
      }
    }
    return { x: px, z: pz };
  }

  function updateWalk(dt) {
    var fx = 0, fz = 0; // forward/strafe in camera space
    if (joy.active) { fx = joy.x; fz = -joy.y; }
    if (keys['w'] || keys['arrowup']) fz += 1;
    if (keys['s'] || keys['arrowdown']) fz -= 1;
    if (keys['a'] || keys['arrowleft']) fx -= 1;
    if (keys['d'] || keys['arrowright']) fx += 1;
    var len = Math.hypot(fx, fz);
    if (len > 1) { fx /= len; fz /= len; }
    var speed = len > 0.05 ? 6 : 0;
    state.walkSpeed = speed;
    if (speed > 0) {
      // camera yaw: 0 = looking -Z
      var sin = Math.sin(state.camYaw), cos = Math.cos(state.camYaw);
      var mx = (fx * cos - fz * sin);
      var mz = (-fx * sin - fz * cos);
      var nx = state.px + mx * speed * dt;
      var nz = state.pz + mz * speed * dt;
      var p = collide(nx, nz, 0.5);
      state.px = p.x; state.pz = p.z;
      // face movement direction
      var targetHeading = Math.atan2(mx, -mz);
      var dh = targetHeading - state.pHeading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      state.pHeading += dh * Math.min(1, dt * 10);
      walkCycle += dt * speed * 1.6;
      playerLegL.rotation.x = Math.sin(walkCycle) * 0.6;
      playerLegR.rotation.x = -Math.sin(walkCycle) * 0.6;
    } else {
      playerLegL.rotation.x = lerp(playerLegL.rotation.x, 0, dt * 8);
      playerLegR.rotation.x = lerp(playerLegR.rotation.x, 0, dt * 8);
    }
    playerMesh.position.set(state.px, 0, state.pz);
    playerMesh.rotation.y = state.pHeading;
    // NPCs stroll
    npcs.forEach(function (n) {
      n.z += n.dir * n.speed * dt;
      if (n.z > 45) n.dir = -1;
      if (n.z < 0) n.dir = 1;
      n.mesh.position.z = n.z;
      n.mesh.rotation.y = n.dir > 0 ? Math.PI : 0;
      n.phase += dt * n.speed * 2;
      n.mesh.userData.legL.rotation.x = Math.sin(n.phase) * 0.5;
      n.mesh.userData.legR.rotation.x = -Math.sin(n.phase) * 0.5;
    });
    // near a parked bus? show the DRIVE / TRAVEL prompt
    var found = null;
    parkedBuses.forEach(function (pb) {
      if (pb.taken) return;
      var d = Math.hypot(state.px - pb.x, state.pz - pb.z);
      if (d < 6) found = pb;
    });
    if (found !== nearBus) {
      nearBus = found;
      if (found) {
        $('prompt-bus-name').textContent = found.spec.name;
        $('prompt-bus-sub').textContent = found.spec.sub + ' · ₹' + found.spec.fare + '/head';
        $('bus-prompt').classList.remove('hidden');
        setMsg('You are next to the ' + found.spec.name + ' — drive it or travel?');
      } else {
        $('bus-prompt').classList.add('hidden');
      }
    }
    // HUD in walk mode
    $('hud-speed').textContent = Math.round(speed * 1.8) + ' km/h';
    $('hud-fare').textContent = '—';
    $('hud-dist').textContent = route.km + ' km';
    if (!nearBus) $('hud-stop').textContent = 'WALK TO A BUS AT THE STAND';
    AudioEngine.setEngine(0);
  }

  // ============================================================================
  // DRIVE MODE — heading-based steering (turns like a real bus)
  // ============================================================================
  function zoneFor(progress) { return Math.min(3, Math.floor(progress * 4)); }
  function zoneStation(zone) { return ZONE_STATIONS[zone]; }

  function updateDriver(dt) {
    var gas = input.gas || keys['arrowup'] || keys['w'];
    var brake = input.brake || keys['arrowdown'] || keys['s'];
    var rev = input.rev || (keys['s'] && state.speed <= 0.5);
    var hb = input.hb || keys[' '];
    var steerKeys = (keys['arrowleft'] || keys['a'] ? -1 : 0) + (keys['arrowright'] || keys['d'] ? 1 : 0);
    var steer = wheelDrag.active ? wheelDrag.steer : steerKeys;
    state.steer = lerp(state.steer, steer, dt * 8);
    // steering only bites while moving
    var steerAuthority = clamp(Math.abs(state.speed) / 18, 0, 1) * 0.9 + 0.1;
    state.heading += state.steer * 1.05 * steerAuthority * dt * (state.speed < 0 ? -1 : 1);
    state.heading = clamp(state.heading, -0.7, 0.7);
    if (gas) state.speed += busSpec.accel * dt;
    if (brake) { state.speed -= 32 * dt; if (state.speed < 0 && !rev) state.speed = 0; } // brake stops, never reverses on its own
    if (rev) state.speed -= 10 * dt; // reverse gear
    if (hb) { state.speed -= state.speed * 6 * dt; if (Math.abs(state.speed) < 0.3) state.speed = 0; } // handbrake
    state.speed -= state.speed * 0.25 * dt;
    if (Math.abs(state.x) > 6.5) state.speed -= 8 * dt; // off-road drag
    state.speed = clamp(state.speed, -8, busSpec.topSpeed);
    state.gear = state.speed < -0.3 ? 'R' : state.speed > 0.3 ? 'D' : (hb ? 'N' : 'P');
    $('hud-gear').textContent = state.gear;
    state.x += Math.sin(state.heading) * state.speed * dt;
    state.z -= Math.cos(state.heading) * state.speed * dt;
    state.x = clamp(state.x, -8.5, 8.5);
    playerBus.position.set(state.x, 0, state.z);
    playerBus.rotation.y = state.heading;
    wheels.forEach(function (w) { w.rotation.x += state.speed * dt * 0.6; });
    AudioEngine.setEngine(state.speed / busSpec.topSpeed);

    var progress = clamp(-state.z / route.length, 0, 1);
    var zone = zoneFor(progress);
    if (zone !== state.zone) {
      state.zone = zone;
      if (!state.manualStation) {
        AudioEngine.setStation(zoneStation(zone));
        updateStationLabel();
      }
      setMsg('📍 ' + route.zones[zone] + ' — 📻 ' + STATIONS[AudioEngine.station].name);
      log('zone ' + zone + ' ' + route.zones[zone] + ' station=' + STATIONS[AudioEngine.station].name);
    }

    if (!boarding) {
      for (var i = 0; i < passengersAtStops.length; i++) {
        var s = passengersAtStops[i];
        if (s.served) continue;
        var dz = state.z - s.z;
        if (dz > 0 && dz < 90 && state.speed > 8) {
          setMsg('🛑 ' + s.name + ' ahead — slow down to pick up passengers!');
        }
        if (dz > 0 && dz < 45 && state.speed < 28 && state.speed > 0) {
          state.speed -= 28 * dt;
          if (state.speed < 0) state.speed = 0;
        }
        if (Math.abs(state.z - s.z) < 18 && state.speed < 8) {
          if (!state.doorsOpen) {
            setMsg('🚪 Open the doors to let passengers board! (DOOR button)');
          } else {
            boarding = { stop: s, t: 0 };
            setMsg('🛑 ' + s.name + ' — passengers boarding…');
            break;
          }
        }
      }
    } else {
      boarding.t += dt;
      state.speed = 0;
      var s2 = boarding.stop;
      s2.people.forEach(function (p) {
        p.position.x = lerp(p.position.x, state.x + 1.4, dt * 2);
        p.position.z = lerp(p.position.z, state.z - 2, dt * 2);
      });
      if (boarding.t > 1.6) {
        var n = s2.people.length;
        s2.people.forEach(function (p) { scene.remove(p); });
        s2.people = [];
        s2.served = true;
        state.fare += busSpec.fare * n;
        state.passengers += n;
        state.stopsServed++;
        AudioEngine.ding();
        setMsg('✅ +' + n + ' passengers · +₹' + (busSpec.fare * n) + ' fare!');
        log('boarded ' + n + ' at ' + s2.name + ' fare=' + state.fare);
        boarding = null;
      }
    }

    var now = performance.now();
    if (now - lastCollide > 1000) {
      var all = botBuses.concat(cars);
      for (var j = 0; j < all.length; j++) {
        var o = all[j];
        if (Math.abs(o.mesh.position.z - state.z) < 6 && Math.abs(o.mesh.position.x - state.x) < 2.6) {
          state.speed *= 0.4;
          lastCollide = now;
          setMsg('⚠️ Dhyaan se! Arre bhai, dekh ke chalao!');
          AudioEngine.horn();
          break;
        }
      }
    }

    // indicators blink, headlight follows the bus, door slides
    var blinkOn = (performance.now() / 500) % 2 < 1;
    if (playerBus.userData.indMatL) {
      playerBus.userData.indMatL.color.setHex(state.indicator === 1 && blinkOn ? 0xf59e0b : 0x444444);
      playerBus.userData.indMatR.color.setHex(state.indicator === 2 && blinkOn ? 0xf59e0b : 0x444444);
    }
    if (headlight) {
      var hfx = Math.sin(state.heading), hfz = -Math.cos(state.heading);
      headlight.position.set(state.x + hfx * 3, 1.4, state.z + hfz * 3);
      headTarget.position.set(state.x + hfx * 30, 0.5, state.z + hfz * 30);
      headlight.intensity = state.lightsOn ? 2.2 : 0;
      if (playerBus.userData.headMat) playerBus.userData.headMat.color.setHex(state.lightsOn ? 0xffffff : 0xfff7cc);
    }
    if (playerBus.userData.door) {
      var dd = playerBus.userData.door;
      dd.position.z = lerp(dd.position.z, state.doorsOpen ? -2.7 : -1.6, dt * 6);
    }

    if (state.z <= -route.length) { endYatra('done'); return; }

    $('hud-speed').textContent = Math.round(Math.abs(state.speed) * 2.2) + ' km/h';
    $('hud-fare').textContent = String(state.fare);
    $('hud-dist').textContent = ((1 - progress) * route.km).toFixed(1) + ' km';
    var next = null;
    for (var k = 0; k < passengersAtStops.length; k++) {
      if (!passengersAtStops[k].served) { next = passengersAtStops[k]; break; }
    }
    $('hud-stop').textContent = next
      ? 'NEXT STOP: ' + next.name + ' · ' + Math.max(0, Math.round((state.z - next.z) / route.length * route.km * 10) / 10) + ' km'
      : 'LAST STOP: ' + route.stops[route.stops.length - 1];
  }

  // ============================================================================
  // PASSENGER MODE — ride the chosen bus, bot-driven
  // ============================================================================
  function updatePassenger(dt) {
    if (!rideBus) return;
    var b = rideBus;
    var target = state.fastForward ? 42 : 16;
    var nextStop = null;
    for (var i = 0; i < passengersAtStops.length; i++) {
      if (!passengersAtStops[i].served) { nextStop = passengersAtStops[i]; break; }
    }
    if (b.halt) {
      b.halt.t += dt;
      b.speed = lerp(b.speed, 0, dt * 5);
      if (b.halt.t > 3) {
        b.halt.stop.served = true;
        state.stopsServed++;
        b.halt = null;
        setMsg('Chalo! Next stop: ' + (nextStop ? nextStop.name : route.stops[route.stops.length - 1]));
      }
    } else if (nextStop && !state.fastForward) {
      var dz = b.mesh.position.z - nextStop.z;
      if (dz < 50 && dz > 0) b.speed = lerp(b.speed, Math.max(0, dz * 0.25), dt * 2);
      else b.speed = lerp(b.speed, target, dt * 2);
      if (dz < 6 && b.speed < 1.5) {
        b.halt = { stop: nextStop, t: 0 };
        setMsg('🛑 ' + nextStop.name + ' — 2 minute halt. Chai peelo!');
      }
    } else {
      b.speed = lerp(b.speed, target, dt * 2);
    }
    b.mesh.position.z -= b.speed * dt;
    b.mesh.position.x = 3.5;
    state.rideDist = (state.rideDist || 0) + (b.speed * dt) / route.length * route.km;
    var progress = clamp(-b.mesh.position.z / route.length, 0, 1);
    var zone = zoneFor(progress);
    if (zone !== state.zone) {
      state.zone = zone;
      if (!state.manualStation) {
        AudioEngine.setStation(zoneStation(zone));
        updateStationLabel();
      }
      setMsg('📍 ' + route.zones[zone] + ' — 📻 ' + STATIONS[AudioEngine.station].name);
    }
    if (headlight) {
      headlight.position.set(b.mesh.position.x, 1.4, b.mesh.position.z - 3);
      headTarget.position.set(b.mesh.position.x, 0.5, b.mesh.position.z - 30);
      headlight.intensity = state.lightsOn ? 2.2 : 0;
    }
    $('hud-speed').textContent = Math.round(b.speed * 2.2) + ' km/h';
    $('hud-fare').textContent = '—';
    $('hud-dist').textContent = ((1 - progress) * route.km).toFixed(1) + ' km';
    $('hud-stop').textContent = 'RIDING · ' + route.stops[route.stops.length - 1] + ' BOUND';
    if (b.mesh.position.z <= -route.length) { endYatra('done'); }
  }

  function updateTraffic(dt) {
    var L = route.length;
    botBuses.forEach(function (b) {
      b.mesh.position.z += b.dir * b.speed * dt;
      if (b.dir < 0 && b.mesh.position.z < -L - 120) b.mesh.position.z = 120;
      if (b.dir > 0 && b.mesh.position.z > 120) b.mesh.position.z = -L - 120;
      if (b.mesh.userData.wheels) b.mesh.userData.wheels.forEach(function (w) { w.rotation.x += b.speed * dt * 0.6; });
    });
    cars.forEach(function (c) {
      c.mesh.position.z += c.dir * c.speed * dt;
      if (c.dir < 0 && c.mesh.position.z < -L - 120) c.mesh.position.z = 120;
      if (c.dir > 0 && c.mesh.position.z > 120) c.mesh.position.z = -L - 120;
    });
    clouds.forEach(function (cl) {
      cl.position.x += dt * 1.2;
      if (cl.position.x > 160) cl.position.x = -160;
    });
  }

  // ============================================================================
  // CAMERAS — 3 real views in EVERY mode (2.13.0's CAM button did nothing
  // while driving; now it always switches)
  // ============================================================================
  var CAM_NAMES = {
    walk: ['FOLLOW', 'FIRST', 'HIGH'],
    driving: ['CHASE', 'CAB', 'BUMPER', 'INSIDE', 'CINE'],
    passenger: ['WINDOW', 'FRONT', 'REAR'],
  };
  function updateCamButton() {
    var names = CAM_NAMES[state.mode] || CAM_NAMES.walk;
    $('hud-cam').textContent = names[state.camView % names.length];
  }

  function updateCamera(dt) {
    if (!camera) return;
    if (state.mode === 'walk' && playerMesh) {
      var px = state.px, pz = state.pz;
      if (state.camView === 1) {
        // first person — hide the player mesh so it doesn't block the view
        playerMesh.visible = false;
        camera.position.set(px, 1.6, pz);
        camera.lookAt(px - Math.sin(state.camYaw) * 10, 1.4, pz - Math.cos(state.camYaw) * 10);
      } else if (state.camView === 2) {
        playerMesh.visible = true;
        camera.position.set(px, 14, pz + 12);
        camera.lookAt(px, 1, pz);
      } else {
        playerMesh.visible = true;
        var tx = px + Math.sin(state.camYaw) * 6.5, tz = pz + Math.cos(state.camYaw) * 6.5;
        camera.position.x = lerp(camera.position.x, tx, dt * 6);
        camera.position.y = lerp(camera.position.y, 3.4, dt * 6);
        camera.position.z = lerp(camera.position.z, tz, dt * 6);
        camera.lookAt(px, 1.4, pz);
      }
    } else if (state.mode === 'driving' && playerBus) {
      var bx = playerBus.position.x, bz = playerBus.position.z;
      var fx = Math.sin(state.heading), fz = -Math.cos(state.heading);
      if (state.camView === 1) {
        // cab — driver's seat, looking out the windshield
        camera.position.set(bx + fx * 2.2, 2.1, bz + fz * 2.2);
        camera.lookAt(bx + fx * 40, 1.6, bz + fz * 40);
      } else if (state.camView === 2) {
        // front bumper, low
        camera.position.set(bx + fx * 3.6, 0.9, bz + fz * 3.6);
        camera.lookAt(bx + fx * 40, 1.0, bz + fz * 40);
      } else if (state.camView === 3) {
        // passenger interior, looking forward through the windshield
        camera.position.set(bx - fx * 0.5, 1.9, bz - fz * 0.5);
        camera.lookAt(bx + fx * 40, 1.6, bz + fz * 40);
      } else if (state.camView === 4) {
        // cinematic — slow orbit around the bus
        var a = performance.now() / 1000 * 0.25;
        camera.position.set(bx + Math.sin(a) * 11, 4.5, bz + Math.cos(a) * 11);
        camera.lookAt(bx, 1.5, bz);
      } else {
        var cx = bx * 0.7, cy = 6.5, cz = bz + 13;
        camera.position.x = lerp(camera.position.x, cx, dt * 4);
        camera.position.y = lerp(camera.position.y, cy, dt * 4);
        camera.position.z = lerp(camera.position.z, cz, dt * 6);
        camera.lookAt(bx, 2, bz - 8);
      }
    } else if (state.mode === 'passenger' && rideBus) {
      var rb = rideBus.mesh.position;
      if (state.camView === 0) {
        // your seat — window or aisle, as picked on the seat map
        var so = SEATS[state.seat].off;
        camera.position.set(rb.x + so[0], so[1], rb.z + so[2]);
        camera.lookAt(rb.x + (so[0] < 0 ? -14 : 14), 1.2, rb.z - 14);
      } else if (state.camView === 1) {
        camera.position.set(rb.x, 2.1, rb.z - 2.2);
        camera.lookAt(rb.x, 1.6, rb.z - 40);
      } else {
        camera.position.set(rb.x, 4.5, rb.z + 9);
        camera.lookAt(rb.x, 1.5, rb.z - 10);
      }
    }
  }

  // ============================================================================
  // CONTROLS — joystick, steering wheel, camera orbit, buttons, keyboard
  // ============================================================================
  function bindHold(el, prop) {
    var on = function (e) { e.preventDefault(); input[prop] = true; el.classList.add('held'); };
    var off = function (e) { e.preventDefault(); input[prop] = false; el.classList.remove('held'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  }
  bindHold($('btn-gas'), 'gas');
  bindHold($('btn-brake'), 'brake');
  bindHold($('btn-rev'), 'rev');
  bindHold($('btn-hb'), 'hb');
  function updateDriveButtons() {
    $('btn-ind-l').classList.toggle('on', state.indicator === 1);
    $('btn-ind-r').classList.toggle('on', state.indicator === 2);
    $('btn-lights').classList.toggle('on', state.lightsOn);
    $('btn-door').classList.toggle('on', state.doorsOpen);
    $('btn-hb').classList.toggle('on', state.handbrake);
  }
  $('btn-ind-l').onclick = function () { state.indicator = state.indicator === 1 ? 0 : 1; updateDriveButtons(); };
  $('btn-ind-r').onclick = function () { state.indicator = state.indicator === 2 ? 0 : 2; updateDriveButtons(); };
  $('btn-lights').onclick = function () { state.lightsOn = !state.lightsOn; updateDriveButtons(); setMsg(state.lightsOn ? '💡 Headlights on' : '💡 Headlights off'); };
  $('btn-door').onclick = function () { state.doorsOpen = !state.doorsOpen; updateDriveButtons(); setMsg(state.doorsOpen ? '🚪 Doors open' : '🚪 Doors closed'); };
  $('btn-hb').addEventListener('pointerdown', function () { state.handbrake = true; updateDriveButtons(); });
  $('btn-hb').addEventListener('pointerup', function () { state.handbrake = false; updateDriveButtons(); });

  // virtual joystick (walk)
  (function () {
    var base = $('joy-base'), nub = $('joy-nub');
    var pid = null;
    function setJoy(e) {
      var r = base.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var len = Math.hypot(dx, dy);
      var max = 34;
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joy.x = dx / max; joy.y = dy / max;
    }
    base.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      pid = e.pointerId;
      base.setPointerCapture(pid);
      joy.active = true;
      setJoy(e);
    });
    base.addEventListener('pointermove', function (e) {
      if (pid === e.pointerId) setJoy(e);
    });
    function endJoy(e) {
      if (pid !== e.pointerId) return;
      pid = null; joy.active = false; joy.x = 0; joy.y = 0;
      nub.style.transform = 'translate(0px,0px)';
    }
    base.addEventListener('pointerup', endJoy);
    base.addEventListener('pointercancel', endJoy);
  })();

  // steering wheel (drive) — drag sideways, springs back to centre
  (function () {
    var wheel = $('wheel');
    var pid = null;
    wheel.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      pid = e.pointerId;
      wheel.setPointerCapture(pid);
      wheelDrag.active = true;
      wheelDrag.startX = e.clientX;
      wheelDrag.steer = 0;
    });
    wheel.addEventListener('pointermove', function (e) {
      if (pid !== e.pointerId) return;
      wheelDrag.steer = clamp((e.clientX - wheelDrag.startX) / 60, -1, 1);
      wheel.style.transform = 'rotate(' + (wheelDrag.steer * 120) + 'deg)';
    });
    function endWheel(e) {
      if (pid !== e.pointerId) return;
      pid = null;
      wheelDrag.active = false;
      wheelDrag.steer = 0;
      wheel.style.transform = 'rotate(0deg)';
    }
    wheel.addEventListener('pointerup', endWheel);
    wheel.addEventListener('pointercancel', endWheel);
  })();

  // drag on the 3D view to orbit the camera (walk mode)
  (function () {
    var pid = null;
    window.addEventListener('pointerdown', function (e) {
      if (state.mode !== 'walk') return;
      if (e.target.closest('#joystick, #hud, #bus-prompt, #drive-controls, #touch-passenger, button')) return;
      pid = e.pointerId;
      camOrbit.active = true;
      camOrbit.lastX = e.clientX;
    });
    window.addEventListener('pointermove', function (e) {
      if (!camOrbit.active || pid !== e.pointerId) return;
      state.camYaw -= (e.clientX - camOrbit.lastX) * 0.005;
      camOrbit.lastX = e.clientX;
    });
    function endOrbit(e) {
      if (pid !== e.pointerId) return;
      pid = null; camOrbit.active = false;
    }
    window.addEventListener('pointerup', endOrbit);
    window.addEventListener('pointercancel', endOrbit);
  })();

  $('btn-horn').onclick = function () { AudioEngine.horn(); setMsg('Peeeeep! 📣'); };
  $('btn-radio').onclick = function () {
    AudioEngine.setStation((AudioEngine.station + 1) % STATIONS.length);
    state.manualStation = true;
    updateStationLabel();
    setMsg('📻 Now playing: ' + STATIONS[AudioEngine.station].name);
  };
  $('btn-music').onclick = function () {
    var panel = $('music-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderMusicList();
  };
  function renderMusicList() {
    var list = $('mp-list');
    list.innerHTML = '';
    STATIONS.forEach(function (st, i) {
      var d = document.createElement('div');
      d.className = 'mp-item' + (i === AudioEngine.station ? ' sel' : '');
      d.innerHTML = '<span>♪ ' + st.name + '</span><span>' + st.bpm + ' BPM</span>';
      d.onclick = function () {
        AudioEngine.setStation(i);
        updateStationLabel();
        renderMusicList();
        setMsg('📻 Now playing: ' + st.name);
      };
      list.appendChild(d);
    });
    $('mp-now').textContent = STATIONS[AudioEngine.station].name;
    $('mp-play').textContent = AudioEngine.musicOn ? '⏸' : '▶';
  }
  function updateMusicPanel() {
    if ($('music-panel').classList.contains('hidden')) return;
    $('mp-bar').style.width = Math.round(AudioEngine.progress() * 100) + '%';
    $('mp-now').textContent = STATIONS[AudioEngine.station].name;
  }
  $('mp-play').onclick = function () {
    AudioEngine.setMusic(!AudioEngine.musicOn);
    updateMusicButton();
    renderMusicList();
    setMsg(AudioEngine.musicOn ? '♪ Music on — ' + STATIONS[AudioEngine.station].name : '♪ Music off');
  };
  $('mp-prev').onclick = function () {
    AudioEngine.setStation((AudioEngine.station + STATIONS.length - 1) % STATIONS.length);
    updateStationLabel(); renderMusicList();
  };
  $('mp-next').onclick = function () {
    AudioEngine.setStation((AudioEngine.station + 1) % STATIONS.length);
    updateStationLabel(); renderMusicList();
  };
  $('mp-vol').oninput = function (e) { AudioEngine.setVolume(e.target.value / 100); };
  $('btn-cam').onclick = function () {
    state.camView = (state.camView + 1) % (state.mode === 'driving' ? 5 : 3);
    updateCamButton();
    setMsg('🎥 Camera: ' + $('hud-cam').textContent);
  };
  $('btn-drive').onclick = function () { if (nearBus) chooseBus(nearBus, true); };
  $('btn-travel').onclick = function () { if (nearBus) chooseBus(nearBus, false); };
  $('btn-getoff').onclick = function () { endYatra('getoff'); };
  $('btn-nextstop').onclick = function () {
    state.fastForward = !state.fastForward;
    setMsg(state.fastForward ? '⏭ Fast-forward to next stop…' : 'Normal speed');
  };
  window.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'h') AudioEngine.horn();
    if (e.key.toLowerCase() === 'c') $('btn-cam').click();
    if (e.key.toLowerCase() === 'r') $('btn-radio').click();
    if (e.key.toLowerCase() === 'm') $('btn-music').click();
    if (e.key.toLowerCase() === 'q') $('btn-ind-l').click();
    if (e.key.toLowerCase() === 'e') $('btn-ind-r').click();
    if (e.key.toLowerCase() === 'n') $('btn-lights').click();
    if (e.key.toLowerCase() === 'o') $('btn-door').click();
  });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  // ============================================================================
  // PORTRAIT LOCK — phones only; desktop landscape keeps working
  // ============================================================================
  function checkOrientation() {
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var portrait = window.innerHeight > window.innerWidth;
    var show = coarse && portrait && state.mode !== 'lobby';
    $('rotate-overlay').classList.toggle('hidden', !show);
    return show;
  }
  window.addEventListener('orientationchange', function () { setTimeout(checkOrientation, 100); });

  // ---- route minimap ----
  var mapTimer = 0;
  function drawMinimap() {
    var cv = $('minimap');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);
    var x0 = W / 2, yTop = 12, yBot = H - 12;
    // route line
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.lineTo(x0, yBot); ctx.stroke();
    // stops
    var n = route.stops.length;
    route.stops.forEach(function (name, i) {
      var y = yTop + (yBot - yTop) * ((i + 1) / (n + 0.0)) * 0.92;
      if (i === n - 1) y = yBot - 4;
      var served = passengersAtStops[i] && passengersAtStops[i].served;
      var isNext = passengersAtStops[i] && !passengersAtStops[i].served;
      ctx.fillStyle = served ? '#22c55e' : (isNext ? '#FFB020' : '#ffffff');
      ctx.beginPath(); ctx.arc(x0, y, served ? 4 : 5, 0, Math.PI * 2); ctx.fill();
    });
    // bus dot
    var prog = 0;
    if (state.mode === 'driving') prog = clamp(-state.z / route.length, 0, 1);
    else if (state.mode === 'passenger' && rideBus) prog = clamp(-rideBus.mesh.position.z / route.length, 0, 1);
    var by = yTop + (yBot - yTop) * prog;
    ctx.fillStyle = '#FF2DA6';
    ctx.beginPath(); ctx.arc(x0, by, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x0, by, 6, 0, Math.PI * 2); ctx.stroke();
    // destination flag
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x0 + 6, yBot - 12, 10, 8);
  }

  // ============================================================================
  // MAIN LOOP + TEST HOOKS
  // ============================================================================
  var lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.1, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (!renderer || !scene) return;
    if (checkOrientation()) { renderer.render(scene, camera); return; }
    if (state.mode === 'walk') {
      state.elapsed = (performance.now() - state.startTime) / 1000;
      updateWalk(dt);
      updateTraffic(dt);
      updateCamera(dt);
    } else if (state.mode === 'driving') {
      state.elapsed = (performance.now() - state.startTime) / 1000;
      updateDriver(dt);
      updateTraffic(dt);
      updateCamera(dt);
    } else if (state.mode === 'passenger') {
      state.elapsed = (performance.now() - state.startTime) / 1000;
      updatePassenger(dt);
      updateTraffic(dt);
      updateCamera(dt);
    }
    // rain falls around the active camera
    if (rainPoints && rainPoints.visible && camera) {
      var pos = rainPoints.geometry.attributes.position;
      for (var ri = 0; ri < 600; ri++) {
        var y = pos.getY(ri) - dt * 22;
        if (y < 0) y = 30;
        pos.setY(ri, y);
        pos.setX(ri, camera.position.x + ((pos.getX(ri) - camera.position.x + 40 + 80) % 80) - 40);
        pos.setZ(ri, camera.position.z + ((pos.getZ(ri) - camera.position.z + 40 + 80) % 80) - 40);
      }
      pos.needsUpdate = true;
    }
    mapTimer += dt;
    if (mapTimer > 0.15) { mapTimer = 0; drawMinimap(); updateMusicPanel(); }
    renderer.render(scene, camera);
  }

  window.__BUSYATRA__ = {
    state: state, version: '2.16.1', save: save, route: function () { return route.id; },
    stations: STATIONS.map(function (s) { return s.name; }),
    audio: AudioEngine,
    nearBus: function () { return nearBus ? nearBus.spec.name : null; },
    parkedNames: function () { return parkedBuses.map(function (pb) { return pb.spec.name; }); },
    routeInfo: function () { return { length: route.length, stops: passengersAtStops.map(function (ps) { return ps.z; }) }; },
    warp: function (z) {
      if (state.mode === 'passenger' && rideBus) rideBus.mesh.position.z = z;
      else state.z = z;
    },
    cam: function () { return camera ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null; },
    player: function () { return { x: state.px, z: state.pz }; },
  };

  buildLobby();
  requestAnimationFrame(loop);
  log('BUS YATRA 2.16.1 loaded');
})();
