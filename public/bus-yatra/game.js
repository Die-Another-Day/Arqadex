import * as THREE from 'three';

// ============================================================================
// BUS YATRA — Indian Bus Simulator · v2.13.0
// One player + bot buses, real Indian routes, driver or passenger,
// radio that changes with the place. All music is ORIGINAL, composed in the
// style of old Bollywood — short catchy hooks, the way the viral parts play
// on a real bus. No copyrighted recordings.
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
  ];
  var BUSES = [
    { id: 'lalpari', name: 'LAL PARI', sub: 'City Bus · red · steady', color: 0xdc2626, stripe: 0xfacc15, topSpeed: 34, accel: 15, fare: 20 },
    { id: 'rajdhani', name: 'RAJDHANI COACH', sub: 'Deluxe · blue · fast', color: 0x2563eb, stripe: 0xe2e8f0, topSpeed: 46, accel: 19, fare: 30 },
    { id: 'vintage', name: 'GAADI NO. 1', sub: 'Vintage · green-yellow · tourist favourite', color: 0x16a34a, stripe: 0xfacc15, topSpeed: 38, accel: 16, fare: 40 },
  ];
  // midi -> freq
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // Each station: a short catchy hook (the "viral part"), looped. Original tunes.
  var STATIONS = [
    { name: 'RETRO ROMANCE', bpm: 92, kind: 'romance',
      // harmonium-style hook, Yaman-ish major
      lead: [[76, .5], [74, .5], [72, .5], [74, .5], [76, 1], [79, .5], [76, .5], [74, 1], [72, .5], [74, .5], [76, 1], [79, 1], [81, .5], [79, .5], [76, 1], [74, 1]],
      bass: [45, 45, 41, 43], drone: [57, 64] },
    { name: 'GHAZAL-E-SHAM', bpm: 68, kind: 'ghazal',
      // slow, minor, long notes
      lead: [[69, 2], [72, 1], [76, 1], [74, 2], [72, 1], [71, 1], [69, 2], [67, 1], [69, 2], [72, 2], [71, 1], [69, 3]],
      bass: [45, 40, 45, 43], drone: [57, 62] },
    { name: 'DHOL FOLK', bpm: 128, kind: 'folk',
      // fast Punjabi pentatonic bounce
      lead: [[74, .25], [76, .25], [78, .25], [81, .25], [81, .25], [78, .25], [76, .25], [74, .5], [71, .25], [74, .25], [76, .25], [78, .5], [76, .25], [74, .25], [71, 1]],
      bass: [50, 50, 45, 47], drone: [62, 69] },
    { name: 'QAWWALI NIGHTS', bpm: 104, kind: 'qawwali',
      // call-and-response, minor, claps on 2 & 4
      lead: [[69, .5], [72, .5], [74, .5], [76, .5], [74, .5], [72, .5], [69, 1], [67, .5], [69, .5], [72, 1], [74, .5], [76, 1], [74, .5], [72, .5], [71, 1], [69, 1]],
      bass: [45, 45, 48, 43], drone: [57, 64] },
  ];

  // ============================================================================
  // AUDIO — WebAudio radio + SFX. Everything synthesized, no audio files.
  // ============================================================================
  var AudioEngine = {
    ctx: null, master: null, radioGain: null, engineOsc: null, engineGain: null,
    station: 0, timer: null, nextNoteTime: 0, step: 0, started: false,
    init: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.value = 0.5;
      this.radioGain.connect(this.master);
      // engine hum
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
      while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
        var t = this.nextNoteTime;
        var barPos = this.step % 8;
        // drone (tanpura) — quiet, every bar start
        if (this.step % 16 === 0) {
          var self = this;
          st.drone.forEach(function (m) { self.note(mf(m), t, beat * 8, 'sine', 0.02); });
        }
        // bass on beats 1 & 3
        if (barPos === 0 || barPos === 4) {
          this.thump(t, 0.22);
          var bassNote = st.bass[Math.floor(this.step / 8) % 4];
          this.note(mf(bassNote), t, beat * 1.2, 'sine', 0.10);
        }
        // dhol tick on offbeats for folk/qawwali
        if ((st.kind === 'folk' || st.kind === 'qawwali') && barPos % 2 === 1) this.tick(t, 0.03);
        // claps on 2 & 4 for qawwali
        if (st.kind === 'qawwali' && (barPos === 2 || barPos === 6)) this.tick(t, 0.05);
        // lead melody — walk the lead array by 8th-note steps
        var leadIdx = this.step % 32;
        var acc = 0, played = false;
        for (var i = 0; i < st.lead.length; i++) {
          var durSteps = st.lead[i][1] * 2; // beats -> 8th steps
          if (leadIdx >= acc && leadIdx < acc + durSteps && leadIdx === acc) {
            this.note(mf(st.lead[i][0]), t, durSteps * stepDur * 0.9, 'sawtooth', 0.055);
            played = true;
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
      this.note(880, t, 0.15, 'sine', 0.12, this.master);
      this.note(1174, t + 0.12, 0.25, 'sine', 0.12, this.master);
    }
  };

  // ============================================================================
  // STATE
  // ============================================================================
  var state = {
    role: 'driver', routeIdx: 0, busIdx: 0, mode: 'lobby',
    speed: 0, steer: 0, x: 3.5, z: 0, heading: 0,
    fare: 0, passengers: 0, stopsServed: 0, startTime: 0, elapsed: 0,
    zone: -1, manualStation: false, camView: 0, fastForward: false,
  };
  var route = ROUTES[0];
  var busSpec = BUSES[0];

  // ============================================================================
  // THREE.JS WORLD
  // ============================================================================
  var renderer, scene, camera, clock;
  var playerBus = null, botBuses = [], cars = [], passengersAtStops = [], stopGroups = [];
  var clouds = [], wheels = [];
  var keys = {};
  var input = { left: false, right: false, gas: false, brake: false };
  var STOP_Z = []; // z positions of stops for current route

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
    // windshield (front = -z) and side windows
    var shield = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), darkMat);
    shield.position.set(0, 2.0, -3.51); shield.rotation.y = Math.PI;
    g.add(shield);
    [-1.31, 1.31].forEach(function (x) {
      var win = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.8), darkMat);
      win.position.set(x, 2.0, 0); win.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(win);
    });
    // destination board
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
    // headlights + taillights
    [-0.85, 0.85].forEach(function (x) {
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfff7cc }));
      hl.position.set(x, 0.85, -3.55); g.add(hl);
      var tl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      tl.position.set(x, 0.85, 3.55); g.add(tl);
    });
    // wheels
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

  function makePassenger(color) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: color }));
    body.position.y = 0.75; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xd9a066 }));
    head.position.y = 1.35; g.add(head);
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

  function makeBuilding(w, h, d, color) {
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
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.68),
      new THREE.MeshBasicMaterial({ map: tex }));
    return sign;
  }

  function buildWorld() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd8ef);
    scene.fog = new THREE.Fog(0x9fd8ef, 60, 240);
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
    camera.position.set(0, 6, 14);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    $('game-root').appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x8a7a5a, 0.95));
    var sun = new THREE.DirectionalLight(0xfff2cc, 1.4);
    sun.position.set(40, 80, 30);
    scene.add(sun);

    var L = route.length;
    // ground — fields
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(700, L + 600),
      new THREE.MeshLambertMaterial({ color: 0x7fae5a }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, -L / 2);
    scene.add(ground);
    // road
    var road = new THREE.Mesh(new THREE.PlaneGeometry(14, L + 400),
      new THREE.MeshLambertMaterial({ color: 0x2f3540 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -L / 2 + 100);
    scene.add(road);
    // centre dashes + edge lines
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
    // scenery — repeat every ~90 units
    var colors = [0xf59e0b, 0xec4899, 0x06b6d4, 0x8b5cf6, 0xf97316, 0x14b8a6];
    for (var sz = 60; sz > -L - 100; sz -= 90) {
      var side = Math.random() < 0.5 ? -1 : 1;
      var kind = Math.random();
      if (kind < 0.4) {
        var b = makeBuilding(rand(5, 9), rand(4, 11), rand(5, 8), pick(colors));
        b.position.set(side * rand(14, 30), 0, sz + rand(-20, 20));
        scene.add(b);
      } else if (kind < 0.75) {
        for (var ti = 0; ti < 3; ti++) {
          var tr = makeTree();
          tr.position.set(side * rand(10, 26), 0, sz + rand(-30, 30));
          scene.add(tr);
        }
      } else {
        // dhaba / shop with awning
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
      // milestone every ~300 units
      if (Math.abs(sz % 300) < 45) {
        var ms = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.3),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
        ms.position.set(7.6, 0.5, sz);
        scene.add(ms);
      }
    }
    // mountains far away
    for (var mi = 0; mi < 14; mi++) {
      var m = new THREE.Mesh(new THREE.ConeGeometry(rand(30, 60), rand(40, 90), 7),
        new THREE.MeshLambertMaterial({ color: 0x64748b }));
      m.position.set((mi % 2 === 0 ? -1 : 1) * rand(120, 220), 0, -mi * (L / 14) + 50);
      scene.add(m);
    }
    // clouds
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
    // billboards
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
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 6),
        new THREE.MeshLambertMaterial({ color: 0x475569 }));
      pole.position.set(bb.position.x, 1.5, bz);
      scene.add(pole);
    }
    // bus stops
    STOP_Z = [];
    route.stops.forEach(function (name, i) {
      var z = -route.length * (i + 1) / (route.stops.length + 0) * 0.9;
      if (i === route.stops.length - 1) z = -route.length * 0.92;
      else z = -route.length * ((i + 1) / route.stops.length) * 0.85;
      STOP_Z.push(z);
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
      // waiting passengers
      var n = 2 + Math.floor(Math.random() * 3);
      var group = [];
      for (var pi = 0; pi < n; pi++) {
        var pax = makePassenger(pick([0xef4444, 0x3b82f6, 0xf59e0b, 0xec4899, 0x22c55e]));
        pax.position.set(9.5 + rand(-1.5, 1.5), 0, z + rand(-2, 2));
        scene.add(pax);
        group.push(pax);
      }
      passengersAtStops.push({ z: z, name: name, people: group, served: false });
    });

    // player bus
    playerBus = makeBus(busSpec.color, busSpec.stripe, route.name);
    playerBus.position.set(state.x, 0, state.z);
    scene.add(playerBus);
    wheels = playerBus.userData.wheels;

    // bot buses + cars
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

    clock = new THREE.Clock();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
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
      b.innerHTML = '<span><b>' + r.name + '</b><i>' + r.sub + ' · Stops: ' + r.stops.join(' → ') + '</i></span><span class="pill">' + r.km + ' KM</span>';
      b.onclick = function () {
        state.routeIdx = i; route = ROUTES[i];
        rl.querySelectorAll('.pick').forEach(function (el) { el.classList.remove('selected'); });
        b.classList.add('selected');
      };
      rl.appendChild(b);
    });
    var bl = $('bus-list');
    bl.innerHTML = '';
    BUSES.forEach(function (bs, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick' + (i === state.busIdx ? ' selected' : '');
      b.innerHTML = '<span><b>' + bs.name + '</b><i>' + bs.sub + '</i></span><span class="pill">₹' + bs.fare + '/HEAD</span>';
      b.onclick = function () {
        state.busIdx = i; busSpec = BUSES[i];
        bl.querySelectorAll('.pick').forEach(function (el) { el.classList.remove('selected'); });
        b.classList.add('selected');
      };
      bl.appendChild(b);
    });
    $('role-row').querySelectorAll('.mode-btn').forEach(function (btn) {
      btn.onclick = function () {
        state.role = btn.dataset.role;
        $('role-row').querySelectorAll('.mode-btn').forEach(function (el) { el.classList.remove('selected'); });
        btn.classList.add('selected');
        $('role-hint').textContent = state.role === 'driver'
          ? 'Driver: steer, pick up passengers at every stop, reach the destination. Fare is your score.'
          : 'Passenger: ride a bot-driven bus, watch India from the window, switch the radio, get off at any stop.';
      };
    });
    $('btn-start').onclick = startYatra;
    $('btn-again').onclick = function () { $('screen-end').classList.add('hidden'); startYatra(); };
    $('btn-lobby').onclick = function () {
      $('screen-end').classList.add('hidden');
      $('screen-lobby').classList.remove('hidden');
      state.mode = 'lobby';
    };
  }

  // ============================================================================
  // GAME FLOW
  // ============================================================================
  var rideBus = null; // passenger mode: the bot bus you ride
  var boarding = null; // { stop, t }
  var lastCollide = 0;

  function startYatra() {
    AudioEngine.init();
    AudioEngine.resume();
    route = ROUTES[state.routeIdx];
    busSpec = BUSES[state.busIdx];
    // rebuild world for the chosen route/bus
    if (renderer) {
      renderer.dispose();
      var root = $('game-root');
      while (root.firstChild) root.removeChild(root.firstChild);
    }
    botBuses = []; cars = []; passengersAtStops = []; stopGroups = []; clouds = [];
    state.speed = 0; state.steer = 0; state.x = 3.5; state.z = 0; state.heading = 0;
    state.fare = 0; state.passengers = 0; state.stopsServed = 0;
    state.zone = -1; state.manualStation = false; state.camView = 0; state.fastForward = false;
    ZONE_STATIONS = [route.station, 2, 1, 3];
    state.startTime = performance.now(); state.elapsed = 0;
    boarding = null;
    buildWorld();
    state.mode = state.role === 'driver' ? 'driving' : 'passenger';
    $('screen-lobby').classList.add('hidden');
    $('screen-end').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('hud-route').textContent = route.name;
    if (state.role === 'driver') {
      $('touch').classList.remove('hidden');
      $('touch-passenger').classList.add('hidden');
      playerBus.visible = true;
      setMsg('Chalo! Next stop: ' + route.stops[0]);
    } else {
      $('touch').classList.add('hidden');
      $('touch-passenger').classList.remove('hidden');
      playerBus.visible = false;
      rideBus = botBuses[0];
      rideBus.speed = 16;
      rideBus.mesh.position.set(3.5, 0, 0);
      setMsg('You are riding the ' + rideBus.mesh.userData.name + '. Enjoy the yatra!');
    }
    if (AudioEngine.started) AudioEngine.setStation(route.station);
    else AudioEngine.startRadio(route.station);
    updateStationLabel();
    log('yatra start role=' + state.role + ' route=' + route.id + ' bus=' + busSpec.id);
  }

  function setMsg(m) { $('hud-msg').textContent = m; }
  function updateStationLabel() { $('hud-station').textContent = STATIONS[AudioEngine.station].name; }

  function showEnd(title, line, rows) {
    state.mode = 'end';
    $('hud').classList.add('hidden');
    $('touch').classList.add('hidden');
    $('touch-passenger').classList.add('hidden');
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
    var mins = Math.floor(state.elapsed / 60);
    var secs = Math.floor(state.elapsed % 60);
    var timeStr = mins + ':' + String(secs).padStart(2, '0');
    if (state.role === 'driver') {
      showEnd(reason === 'done' ? 'MANZIL AA GAYI! 🎉' : 'YATRA KHATAM',
        reason === 'done'
          ? 'You reached ' + route.stops[route.stops.length - 1] + ' with ₹' + state.fare + ' fare. Shabaash, ustaad!'
          : 'Yatra ended midway — ' + state.passengers + ' passengers rode with you.',
        [['ROLE', 'DRIVER'], ['ROUTE', route.name], ['FARE COLLECTED', '₹' + state.fare],
         ['PASSENGERS', String(state.passengers)], ['STOPS SERVED', state.stopsServed + ' / ' + route.stops.length],
         ['TIME', timeStr]]);
    } else {
      var km = (state.rideDist || 0).toFixed(1);
      showEnd('UTAR GAYE! 👋',
        'You travelled ' + km + ' km as a passenger. Kaisi lagi yatra?',
        [['ROLE', 'PASSENGER'], ['ROUTE', route.name], ['DISTANCE RODE', km + ' km'],
         ['STOPS PASSED', String(state.stopsServed)], ['TIME', timeStr]]);
    }
  }

  // ============================================================================
  // CONTROLS
  // ============================================================================
  function bindHold(el, prop) {
    var on = function (e) { e.preventDefault(); input[prop] = true; el.classList.add('held'); };
    var off = function (e) { e.preventDefault(); input[prop] = false; el.classList.remove('held'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  }
  bindHold($('btn-left'), 'left');
  bindHold($('btn-right'), 'right');
  bindHold($('btn-gas'), 'gas');
  bindHold($('btn-brake'), 'brake');
  $('btn-horn').onclick = function () { AudioEngine.horn(); setMsg('Peeeeep! 📣'); };
  $('btn-radio').onclick = function () {
    AudioEngine.setStation((AudioEngine.station + 1) % STATIONS.length);
    state.manualStation = true;
    updateStationLabel();
    setMsg('📻 Now playing: ' + STATIONS[AudioEngine.station].name);
  };
  $('btn-cam').onclick = function () {
    state.camView = (state.camView + 1) % 3;
    setMsg('🎥 Camera ' + ['WINDOW', 'FRONT', 'REAR'][state.camView]);
  };
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
  });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  function readKeys() {
    input.gas = input.gas || keys['arrowup'] || keys['w'];
    input.brake = input.brake || keys['arrowdown'] || keys['s'];
    input.left = input.left || keys['arrowleft'] || keys['a'];
    input.right = input.right || keys['arrowright'] || keys['d'];
  }

  // ============================================================================
  // UPDATE
  // ============================================================================
  function zoneFor(progress) { return Math.min(3, Math.floor(progress * 4)); }
  var ZONE_STATIONS = [0, 2, 1, 3]; // [route default, folk, ghazal, qawwali]
  function zoneStation(zone) { return ZONE_STATIONS[zone]; }

  function updateDriver(dt) {
    var gas = input.gas || keys['arrowup'] || keys['w'];
    var brake = input.brake || keys['arrowdown'] || keys['s'];
    var left = input.left || keys['arrowleft'] || keys['a'];
    var right = input.right || keys['arrowright'] || keys['d'];
    var targetSteer = (left ? -1 : 0) + (right ? 1 : 0);
    state.steer = lerp(state.steer, targetSteer, dt * 6);
    if (gas) state.speed += busSpec.accel * dt;
    if (brake) state.speed -= 30 * dt;
    if (boarding) state.speed = 0;
    state.speed -= state.speed * 0.25 * dt; // drag
    if (Math.abs(state.x) > 6.5) state.speed -= 8 * dt; // off-road
    state.speed = clamp(state.speed, 0, busSpec.topSpeed);
    state.x += state.steer * state.speed * 0.55 * dt;
    state.x = clamp(state.x, -7.5, 7.5);
    state.z -= state.speed * dt;
    state.heading = lerp(state.heading, -state.steer * 0.22, dt * 8);
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

    // stops: slow down inside a stop zone to board
    if (!boarding) {
      for (var i = 0; i < passengersAtStops.length; i++) {
        var s = passengersAtStops[i];
        if (s.served) continue;
        var dz = state.z - s.z; // >0 while approaching
        if (dz > 0 && dz < 90 && state.speed > 8) {
          setMsg('🛑 ' + s.name + ' ahead — slow down to pick up passengers!');
        }
        // brake assist: the bus pulls itself into the stop once you're slow enough
        if (dz > 0 && dz < 45 && state.speed < 28 && state.speed > 0) {
          state.speed -= 28 * dt;
          if (state.speed < 0) state.speed = 0;
        }
        if (Math.abs(state.z - s.z) < 18 && state.speed < 8) {
          boarding = { stop: s, t: 0 };
          setMsg('🛑 ' + s.name + ' — passengers boarding…');
          break;
        }
      }
    } else {
      boarding.t += dt;
      var s2 = boarding.stop;
      s2.people.forEach(function (p, idx) {
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

    // collisions with traffic
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

    if (state.z <= -route.length) { endYatra('done'); return; }

    // HUD
    $('hud-speed').textContent = Math.round(state.speed * 2.2) + ' km/h';
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
      var dz = b.mesh.position.z - nextStop.z; // >0 while approaching
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
    $('hud-speed').textContent = Math.round(b.speed * 2.2) + ' km/h';
    $('hud-fare').textContent = '—';
    $('hud-dist').textContent = ((1 - progress) * route.km).toFixed(1) + ' km';
    $('hud-stop').textContent = 'RIDING · ' + route.stops[route.stops.length - 1] + ' BOUND';
    if (b.mesh.position.z <= -route.length) { endYatra('done'); }
  }

  function updateTraffic(dt) {
    var L = route.length;
    botBuses.forEach(function (b) {
      if (b === rideBus && state.mode === 'passenger') return; // handled above
      b.mesh.position.z += b.dir * b.speed * dt;
      if (b.dir < 0 && b.mesh.position.z < -L - 120) b.mesh.position.z = 120;
      if (b.dir > 0 && b.mesh.position.z > 120) b.mesh.position.z = -L - 120;
      b.mesh.userData.wheels && b.mesh.userData.wheels.forEach(function (w) { w.rotation.x += b.speed * dt * 0.6; });
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

  function updateCamera(dt) {
    if (!camera) return;
    if (state.mode === 'driving' && playerBus) {
      var tx = playerBus.position.x * 0.7, ty = 6.5, tz = playerBus.position.z + 13;
      camera.position.x = lerp(camera.position.x, tx, dt * 4);
      camera.position.y = lerp(camera.position.y, ty, dt * 4);
      camera.position.z = lerp(camera.position.z, tz, dt * 6);
      camera.lookAt(playerBus.position.x, 2, playerBus.position.z - 8);
    } else if (state.mode === 'passenger' && rideBus) {
      var rb = rideBus.mesh.position;
      if (state.camView === 0) {
        camera.position.set(rb.x - 1.2, 2.1, rb.z - 0.5);
        camera.lookAt(rb.x - 14, 1.2, rb.z - 14);
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
  // MAIN LOOP + TEST HOOKS
  // ============================================================================
  var lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.1, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (!renderer || !scene) return;
    if (state.mode === 'driving') {
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
    renderer.render(scene, camera);
  }

  window.__BUSYATRA__ = {
    state: state, version: '2.13.0', route: function () { return route.id; },
    stations: STATIONS.map(function (s) { return s.name; }),
  };

  buildLobby();
  requestAnimationFrame(loop);
  log('BUS YATRA 2.13.0 loaded');
})();
