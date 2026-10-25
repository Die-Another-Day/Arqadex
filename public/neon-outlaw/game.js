/* NEON OUTLAW — Part 2: story, races, rivals, pedestrians, districts, day/night.
   Original game inspired by the GTA formula (third-person open world, wanted
   stars, police chases, missions) — no Rockstar assets, names, map or code. */
import * as THREE from 'three'
import { buildCity, buildCar, buildPed, buildGate, buildPlayer } from './models.js'

const $ = (id) => document.getElementById(id)
const ROAD_LINES = [-135, -81, -27, 27, 81, 135]
const WORLD = 200
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerpAngle = (a, b, t) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}
const VEHICLE_STATS = {
  sedan: { accel: 16, top: 26, brake: 26 },
  sport: { accel: 21, top: 33, brake: 28 },
  van: { accel: 11, top: 20, brake: 22 },
}

// ---------- story: the mission chain ----------
const MISSIONS = [
  { id: 'first-wheels', name: 'FIRST WHEELS', type: 'goto', target: [170, -60], reward: 300, time: 0, wanted: 0,
    brief: 'The Fixer has a job. Drive to the docks garage and prove you can handle wheels.' },
  { id: 'midnight-sprint', name: 'MIDNIGHT SPRINT', type: 'race', gates: [[40, -27], [135, -27], [170, -60], [60, 170], [0, 0]], rewards: [1000, 400, 150],
    brief: 'Street race. 5 gates, 2 rivals. Finish first for the big money.' },
  { id: 'heat-run', name: 'HEAT RUN', type: 'getaway', target: [170, -60], reward: 800, time: 90, wanted: 3,
    brief: 'The heat is already on you — 3 stars. Get the package to the docks garage in 90 seconds.' },
  { id: 'beach-blitz', name: 'BEACH BLITZ', type: 'race', gates: [[-60, 170], [60, 170], [170, 60], [135, 27], [0, 0]], rewards: [1200, 500, 200],
    brief: 'Final race: beach, docks, downtown, plaza. Win this and you run Neon City.' },
]

// ---------- scene ----------
const container = $('game-container')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setSize(innerWidth, innerHeight)
container.appendChild(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050514)
scene.fog = new THREE.Fog(0x050514, 60, 260)
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 600)
const hemi = new THREE.HemisphereLight(0x8899ff, 0x220022, 0.8)
scene.add(hemi)
const sun = new THREE.DirectionalLight(0xaaaaff, 0.7)
sun.position.set(50, 100, 30)
scene.add(sun)

const { colliders } = buildCity(scene)

// ---------- entities ----------
const player = buildPlayer()
player.position.set(0, 0, 0)
scene.add(player)

// the Fixer — story quest giver, gold jacket, bobbing diamond marker
const fixer = buildPed(0xFFD23F, 0x111111)
fixer.position.set(-6, 0, -6)
scene.add(fixer)
const fixerMark = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFD23F, emissiveIntensity: 3 }))
fixerMark.position.set(-6, 3.2, -6)
scene.add(fixerMark)

const CAR_COLORS = [0xFF2DA6, 0x00F5FF, 0xFFD23F, 0x4DFF88, 0xFF5533, 0xE8E8E8]
const parked = []
function addParked (x, z, heading, type = 'sedan') {
  const car = buildCar(CAR_COLORS[parked.length % CAR_COLORS.length], false, type)
  car.position.set(x, 0, z); car.rotation.y = heading
  car.userData.parked = true; car.userData.type = type
  scene.add(car); parked.push(car)
  return car
}
addParked(3, 3, Math.PI / 2, 'sedan') // hero car, right by spawn, facing the open plaza road
addParked(-30, -27, 0, 'sport'); addParked(40, 27, Math.PI / 2, 'van'); addParked(-70, 81, -Math.PI / 2, 'sedan'); addParked(90, -81, 0, 'sport')

const traffic = []
for (let i = 0; i < 6; i++) {
  const r1 = ROAD_LINES[i % ROAD_LINES.length], r2 = ROAD_LINES[(i + 2) % ROAD_LINES.length]
  const car = buildCar(CAR_COLORS[(i + 2) % CAR_COLORS.length])
  car.position.set(-130, 0, r1)
  car.userData.route = [[-130, r1], [130, r1], [130, r2], [-130, r2]]
  car.userData.wp = 1; car.userData.speed = 8
  scene.add(car); traffic.push(car)
}

const police = []
function spawnPolice () {
  if (police.length >= 4) return
  const car = buildCar(0xFFFFFF, true)
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2, d = 65 + Math.random() * 20
    const x = clamp(player.position.x + Math.sin(a) * d, -190, 190)
    const z = clamp(player.position.z + Math.cos(a) * d, -190, 190)
    if (!collideCircle(x, z, 2)) { car.position.set(x, 0, z); break }
    car.position.set(x, 0, z)
  }
  scene.add(car); police.push({ car, bustedHold: 0 })
}

// checkpoint beacon (goto / getaway missions)
const beacon = new THREE.Group()
const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 22, 12), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFD23F, emissiveIntensity: 2, transparent: true, opacity: 0.35 }))
pillar.position.y = 11
const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFD23F, emissiveIntensity: 2 }))
beacon.add(pillar, beaconBase)
beacon.visible = false
scene.add(beacon)

// race gates (built per race)
let gateMeshes = []
function buildGates (gatePts) {
  clearGates()
  gateMeshes = gatePts.map(([x, z]) => {
    const g = buildGate()
    g.position.set(x, 0, z)
    g.rotation.y = Math.PI / 2 // gates face along the road by default
    scene.add(g)
    return g
  })
  paintGates(0)
}
function clearGates () {
  for (const g of gateMeshes) scene.remove(g)
  gateMeshes = []
}
function paintGates (nextIdx) {
  gateMeshes.forEach((g, i) => {
    const col = i < nextIdx ? 0x00FF88 : i === nextIdx ? 0xFFD23F : 0x334455
    g.userData.mats[0].emissive.setHex(col)
  })
}

// pedestrians — sidewalk walkers with flee + knockdown behaviour
const PED_COLORS = [0xFF6A88, 0x88AAFF, 0xFFAA33, 0x66CC99, 0xCC66FF, 0xEEEEEE]
const peds = []
function pedBlock () {
  const i = -2 + Math.floor(Math.random() * 5), j = -2 + Math.floor(Math.random() * 5)
  if (i === 0 && j === 0) return pedBlock()
  return [i * 54, j * 54]
}
function spawnPed () {
  const [cx, cz] = pedBlock()
  const mesh = buildPed(PED_COLORS[peds.length % PED_COLORS.length], Math.random() < 0.4 ? 0x222222 : null)
  const corners = [[cx - 21.5, cz - 21.5], [cx + 21.5, cz - 21.5], [cx + 21.5, cz + 21.5], [cx - 21.5, cz + 21.5]]
  mesh.position.set(corners[0][0], 0, corners[0][1])
  scene.add(mesh)
  peds.push({ mesh, corners, wp: 1, fleeT: 0, downT: 0, bob: Math.random() * 10 })
}
for (let i = 0; i < 14; i++) spawnPed()

// race rivals
let rivals = []
function spawnRivals (gatePts) {
  clearRivals()
  const f = fwd(S.driving && S.car ? S.car.rotation.y : S.heading)
  const base = S.driving && S.car ? S.car.position : player.position
  for (let i = 0; i < 2; i++) {
    const car = buildCar(i === 0 ? 0xFF3333 : 0x3388FF, false, 'sport')
    car.position.set(base.x - f.x * (8 + i * 4) + (i === 0 ? -3 : 3) * f.z, 0, base.z - f.z * (8 + i * 4) + (i === 0 ? 3 : -3) * f.x)
    car.rotation.y = S.driving && S.car ? S.car.rotation.y : S.heading
    scene.add(car)
    rivals.push({ car, next: 0, stuckT: 0, revT: 0, lastX: car.position.x, lastZ: car.position.z })
  }
}
function clearRivals () {
  for (const r of rivals) scene.remove(r.car)
  rivals = []
}

// ---------- state ----------
const S = {
  running: false, paused: false,
  driving: false, car: null, carType: 'sedan',
  heading: 0, speed: 0, vy: 0, grounded: true,
  camMode: 0, camAngle: Math.PI, dragOffset: 0,
  wanted: 0, hideTimer: 0, ramCooldown: 0,
  cash: Number(localStorage.getItem('neon-outlaw-cash') || 0),
  missionIdx: Number(localStorage.getItem('neon-outlaw-mission') || 0),
  mission: null, bannerT: 0, time: 0, dayT: 0,
  soundOn: true, sirenT: 0,
}
window.__NO = S // test hook for the browser verification run
window.__NO.colliders = colliders
window.__NO.MISSIONS = MISSIONS
// debug only: ?debug=1 enables teleporting the player/car for verification runs
if (location.search.includes('debug=1')) {
  window.__NO.teleport = (x, z) => {
    const f = S.driving && S.car ? S.car : player
    f.position.x = x; f.position.z = z
  }
  window.__NO.peds = peds
  window.__NO.rivals = () => rivals
  window.__NO.police = () => police
}
const keys = {}
const touch = { x: 0, y: 0, gas: false, brake: false }

// mission list on the start screen
;(function fillMissionList () {
  const el = $('mission-list')
  if (!el) return
  el.innerHTML = MISSIONS.map((m, i) => `<li class="${i < S.missionIdx ? 'done' : i === S.missionIdx ? 'next' : ''}">${i < S.missionIdx ? '✓' : i === S.missionIdx ? '▸' : '○'} ${m.name}</li>`).join('')
})()

// ---------- synth sound (no audio assets — WebAudio oscillators) ----------
let AC = null, master = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null
function initAudio () {
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)()
    master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination)
    engineOsc = AC.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60
    engineGain = AC.createGain(); engineGain.gain.value = 0
    engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start()
    sirenOsc = AC.createOscillator(); sirenOsc.type = 'square'; sirenOsc.frequency.value = 750
    sirenGain = AC.createGain(); sirenGain.gain.value = 0
    sirenOsc.connect(sirenGain); sirenGain.connect(master); sirenOsc.start()
  } catch { AC = null }
}
function blip (freq, dur = 0.15, vol = 0.18) {
  if (!AC || !S.soundOn) return
  try {
    const o = AC.createOscillator(), g = AC.createGain()
    o.type = 'square'; o.frequency.value = freq
    g.gain.setValueAtTime(vol, AC.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur)
    o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime + dur)
  } catch {}
}
function fanfare () { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.22, 0.22), i * 130)) }

// ---------- input ----------
addEventListener('keydown', (e) => {
  keys[e.code] = true
  if (!S.running || S.paused) return
  if (e.code === 'KeyE') tryEnterExit()
  if (e.code === 'KeyC') setCamMode(S.camMode === 2 ? 0 : 2)
  if (e.code === 'KeyV') setCamMode((S.camMode + 1) % 3)
  if (e.code === 'KeyM') startMission()
  if (e.code === 'KeyP') togglePause()
  if (e.code === 'KeyN') { S.soundOn = !S.soundOn; banner(S.soundOn ? 'SOUND ON' : 'SOUND OFF') }
})
addEventListener('keyup', (e) => { keys[e.code] = false })
function setCamMode (m) {
  S.camMode = m
  $('bar-top').classList.toggle('hidden', m !== 2)
  $('bar-bottom').classList.toggle('hidden', m !== 2)
}
function togglePause () { S.paused = !S.paused; showOverlay('paused') }
function showOverlay (kind) {
  const o = $('overlay')
  if (kind === 'paused' && !S.paused) { o.classList.add('hidden'); return }
  o.classList.remove('hidden')
  if (kind === 'busted') {
    $('overlay-title').textContent = 'BUSTED!'
    $('overlay-text').textContent = 'The cops caught up with you. The city never sleeps — neither do they.'
    $('btn-respawn').textContent = 'GET BACK OUT THERE'
  } else {
    $('overlay-title').textContent = 'PAUSED'
    $('overlay-text').textContent = 'Neon City waits for no one. Well — except right now.'
    $('btn-respawn').textContent = 'RESUME'
  }
  o.dataset.kind = kind
}
$('btn-respawn').addEventListener('click', () => {
  if ($('overlay').dataset.kind === 'busted') respawn()
  else { S.paused = false; $('overlay').classList.add('hidden') }
})
$('btn-start').addEventListener('click', () => {
  $('start-screen').classList.add('hidden')
  $('hud').classList.remove('hidden')
  if ('ontouchstart' in window) $('touch').classList.remove('hidden')
  initAudio()
  S.running = true
})

let dragging = false, lastX = 0
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX })
addEventListener('pointermove', (e) => { if (dragging) { S.dragOffset += (e.clientX - lastX) * 0.005; lastX = e.clientX } })
addEventListener('pointerup', () => { dragging = false })

const stick = $('stick-base'), knob = $('stick-knob')
if (stick) {
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); moveStick(e.touches[0]) }, { passive: false })
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); moveStick(e.touches[0]) }, { passive: false })
  stick.addEventListener('touchend', () => { touch.x = 0; touch.y = 0; knob.style.transform = 'translate(0,0)' })
  function moveStick (t) {
    const r = stick.getBoundingClientRect()
    const dx = clamp((t.clientX - (r.left + r.width / 2)) / 55, -1, 1)
    const dy = clamp((t.clientY - (r.top + r.height / 2)) / 55, -1, 1)
    touch.x = dx; touch.y = dy
    knob.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`
  }
  document.querySelectorAll('#touch-btns button').forEach((b) => {
    const k = b.dataset.k
    b.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (k === 'gas') touch.gas = true
      if (k === 'brake') touch.brake = true
      if (k === 'enter') tryEnterExit()
      if (k === 'cam') setCamMode((S.camMode + 1) % 3)
    }, { passive: false })
    b.addEventListener('touchend', () => { if (k === 'gas') touch.gas = false; if (k === 'brake') touch.brake = false })
  })
}

// ---------- helpers ----------
function collideCircle (x, z, r) {
  for (const c of colliders) {
    const nx = clamp(x, c.minX, c.maxX), nz = clamp(z, c.minZ, c.maxZ)
    const dx = x - nx, dz = z - nz
    if (dx * dx + dz * dz < r * r) return { nx, nz, dx, dz }
  }
  return null
}
function fwd (h) { return { x: Math.sin(h), z: Math.cos(h) } }
function banner (text, ms = 2600) { $('banner').textContent = text; S.bannerT = ms / 1000 }
function saveProgress () {
  localStorage.setItem('neon-outlaw-cash', String(S.cash))
  localStorage.setItem('neon-outlaw-mission', String(S.missionIdx))
}
function tryEnterExit () {
  if (S.driving) {
    const c = S.car
    const rx = Math.cos(c.rotation.y), rz = -Math.sin(c.rotation.y)
    player.position.set(c.position.x + rx * 2.6, 0, c.position.z + rz * 2.6)
    player.visible = true
    c.userData.parked = true
    if (!parked.includes(c)) parked.push(c)
    S.driving = false; S.car = null; S.speed = 0
    return
  }
  let best = null, bd = 5
  for (const c of parked) {
    const d = c.position.distanceTo(player.position)
    if (d < bd) { bd = d; best = c }
  }
  if (!best) { banner('NO CAR NEARBY'); return }
  parked.splice(parked.indexOf(best), 1)
  best.userData.parked = false
  player.visible = false
  S.driving = true; S.car = best; S.carType = best.userData.type || 'sedan'; S.speed = 0
  banner('CAR JACKED — DRIVE!')
}
function clearMissionVisuals () {
  beacon.visible = false
  clearGates(); clearRivals()
}
function startMission () {
  if (S.mission) { banner('MISSION ALREADY RUNNING'); return }
  if (S.missionIdx >= MISSIONS.length) { banner('ALL JOBS DONE — YOU RUN NEON CITY'); return }
  const m = MISSIONS[S.missionIdx]
  if (m.type === 'race') {
    buildGates(m.gates)
    spawnRivals(m.gates)
    S.mission = { def: m, playerNext: 0 }
    banner('RACE: ' + m.name + ' — GO!')
  } else {
    beacon.position.set(m.target[0], 0, m.target[1])
    beacon.visible = true
    S.mission = { def: m, t: m.time || 0 }
    if (m.wanted && S.wanted < m.wanted) S.wanted = m.wanted
    banner('MISSION: ' + m.name)
  }
  blip(660, 0.2, 0.2)
}
function completeMission (reward) {
  S.cash += reward
  S.missionIdx++
  saveProgress()
  clearMissionVisuals()
  S.mission = null
  banner('MISSION PASSED! +$' + reward, 4000)
  fanfare()
  fillMissionList()
}
function failMission (text) {
  clearMissionVisuals()
  S.mission = null
  banner(text, 4000)
}
function fillMissionList () {
  const el = $('mission-list')
  if (!el) return
  el.innerHTML = MISSIONS.map((m, i) => `<li class="${i < S.missionIdx ? 'done' : i === S.missionIdx ? 'next' : ''}">${i < S.missionIdx ? '✓' : i === S.missionIdx ? '▸' : '○'} ${m.name}</li>`).join('')
}
function respawn () {
  $('overlay').classList.add('hidden')
  player.position.set(0, 0, 0); player.visible = true
  S.driving = false; S.car = null; S.speed = 0; S.wanted = 0
  failMission('')
  $('banner').textContent = ''
  for (const p of police) scene.remove(p.car)
  police.length = 0
  S.paused = false
}
function busted () {
  S.paused = true
  blip(160, 0.5, 0.25)
  showOverlay('busted')
}

// ---------- HUD / minimap ----------
const mm = $('minimap').getContext('2d')
function drawMinimap () {
  const W = 150, sc = W / (WORLD * 2)
  mm.clearRect(0, 0, W, W)
  mm.fillStyle = 'rgba(10,10,25,0.9)'; mm.beginPath(); mm.arc(75, 75, 75, 0, 7); mm.fill()
  mm.save(); mm.beginPath(); mm.arc(75, 75, 75, 0, 7); mm.clip()
  mm.fillStyle = '#8a7a4a'; mm.fillRect(0, (150 + WORLD) * sc, W, 50 * sc) // beach (south, z 150..200)
  mm.fillStyle = '#14331c'; mm.fillRect(0, 0, W, 50 * sc) // park (north, z -200..-150)
  mm.fillStyle = '#2a2a33'; mm.fillRect((150 + WORLD) * sc, 0, 50 * sc, W) // docks (east, x 150..200)
  mm.strokeStyle = 'rgba(255,255,255,0.25)'
  for (const c of ROAD_LINES) {
    mm.beginPath(); mm.moveTo(0, (c + WORLD) * sc); mm.lineTo(W, (c + WORLD) * sc); mm.stroke()
    mm.beginPath(); mm.moveTo((c + WORLD) * sc, 0); mm.lineTo((c + WORLD) * sc, W); mm.stroke()
  }
  mm.fillStyle = 'rgba(120,140,220,0.5)'
  for (const c of colliders) mm.fillRect((c.minX + WORLD) * sc, (c.minZ + WORLD) * sc, (c.maxX - c.minX) * sc, (c.maxZ - c.minZ) * sc)
  const dot = (x, z, col, r = 3) => { mm.fillStyle = col; mm.beginPath(); mm.arc((x + WORLD) * sc, (z + WORLD) * sc, r, 0, 7); mm.fill() }
  if (beacon.visible) dot(beacon.position.x, beacon.position.z, '#FFD23F', 5)
  for (const g of gateMeshes) dot(g.position.x, g.position.z, '#FFD23F', 3)
  dot(fixer.position.x, fixer.position.z, '#FFD23F', 4)
  for (const t of traffic) dot(t.position.x, t.position.z, '#888888', 2)
  for (const p of police) dot(p.car.position.x, p.car.position.z, '#FF3333', 3)
  const px = (player.position.x + WORLD) * sc, pz = (player.position.z + WORLD) * sc
  const focus = S.driving && S.car ? S.car : player
  mm.save(); mm.translate(px, pz); mm.rotate(-focus.rotation.y); mm.fillStyle = '#FFFFFF'
  mm.beginPath(); mm.moveTo(0, -6); mm.lineTo(4, 5); mm.lineTo(-4, 5); mm.closePath(); mm.fill(); mm.restore()
  mm.restore()
}
let lastStars = '', lastCash = -1, lastMode = '', lastObj = ''
function updateHUD () {
  const stars = '★'.repeat(S.wanted) + '☆'.repeat(4 - S.wanted)
  if (stars !== lastStars) { $('wanted').textContent = stars; lastStars = stars }
  if (S.cash !== lastCash) { $('cash').textContent = '$' + S.cash.toLocaleString(); lastCash = S.cash }
  const mode = S.driving ? 'DRIVING · ' + S.carType.toUpperCase() : 'ON FOOT'
  if (mode !== lastMode) { $('mode').textContent = mode; lastMode = mode }
  $('speed').innerHTML = Math.round(Math.abs(S.speed) * 3.6) + '<span>KM/H</span>'
  let obj = ''
  if (S.mission) {
    const m = S.mission.def
    if (m.type === 'race') obj = `RACE ${m.name} — P${racePosition()} · GATE ${S.mission.playerNext + 1}/${m.gates.length}`
    else obj = `MISSION ${m.name} — ${m.brief}`
    $('mission-timer').textContent = S.mission.t ? 'TIME ' + Math.ceil(S.mission.t) + 's' : ''
  } else {
    $('mission-timer').textContent = ''
    const nearFixer = player.position.distanceTo(fixer.position) < 8
    obj = nearFixer ? 'The Fixer has work — press M' : S.missionIdx >= MISSIONS.length ? 'You run Neon City. Free roam.' : 'Press M — next job: ' + MISSIONS[S.missionIdx].name
  }
  if (obj !== lastObj) { $('objective').textContent = obj; lastObj = obj }
  if (S.bannerT <= 0) $('banner').textContent = ''
}
function raceProgress (pos, next, gates) {
  if (next >= gates.length) return 1e9
  const g = gates[next]
  return next * 1000 - Math.hypot(g[0] - pos.x, g[1] - pos.z)
}
function racePosition () {
  if (!S.mission || S.mission.def.type !== 'race') return 1
  const m = S.mission.def
  const focus = S.driving && S.car ? S.car.position : player.position
  const mine = raceProgress(focus, S.mission.playerNext, m.gates)
  let pos = 1
  for (const r of rivals) if (raceProgress(r.car.position, r.next, m.gates) > mine) pos++
  return pos
}

// ---------- day / night ----------
const SKY_STOPS = [
  { p: 0.00, bg: new THREE.Color(0x050514), hemi: 0.8, sunI: 0.7 },
  { p: 0.25, bg: new THREE.Color(0x2a1a3a), hemi: 0.9, sunI: 0.8 },
  { p: 0.50, bg: new THREE.Color(0x3a5a8a), hemi: 1.2, sunI: 1.0 },
  { p: 0.75, bg: new THREE.Color(0x40200a), hemi: 0.9, sunI: 0.8 },
  { p: 1.00, bg: new THREE.Color(0x050514), hemi: 0.8, sunI: 0.7 },
]
const _c = new THREE.Color()
function updateSky () {
  const ph = (S.dayT % 240) / 240
  let a = SKY_STOPS[0], b = SKY_STOPS[SKY_STOPS.length - 1]
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    if (ph >= SKY_STOPS[i].p && ph <= SKY_STOPS[i + 1].p) { a = SKY_STOPS[i]; b = SKY_STOPS[i + 1]; break }
  }
  const t = (ph - a.p) / Math.max(0.001, b.p - a.p)
  _c.copy(a.bg).lerp(b.bg, t)
  scene.background.copy(_c); scene.fog.color.copy(_c)
  hemi.intensity = a.hemi + (b.hemi - a.hemi) * t
  sun.intensity = a.sunI + (b.sunI - a.sunI) * t
}

// ---------- main loop ----------
const clock = new THREE.Clock()
function animate () {
  requestAnimationFrame(animate)
  // Clamp at 0.1s: on a slow device the game should get choppy,
  // not run in slow motion, until frames genuinely exceed 100ms.
  const dt = Math.min(clock.getDelta(), 0.1)
  S.time += dt; S.dayT += dt
  if (S.running && !S.paused) update(dt)
  updateSky()
  updateCamera(dt)
  drawMinimap()
  updateHUD()
  renderer.render(scene, camera)
}
function update (dt) {
  const fwdKey = keys.KeyW || keys.ArrowUp || touch.y < -0.3 || touch.gas
  const backKey = keys.KeyS || keys.ArrowDown || touch.y > 0.3 || touch.brake
  const leftKey = keys.KeyA || keys.ArrowLeft || touch.x < -0.3
  const rightKey = keys.KeyD || keys.ArrowRight || touch.x > 0.3
  const run = keys.ShiftLeft || keys.ShiftRight
  S.ramCooldown = Math.max(0, S.ramCooldown - dt)
  if (S.bannerT > 0) S.bannerT -= dt

  // audio: engine hum follows speed, siren when wanted
  if (AC && engineOsc && engineGain) {
    const target = S.driving ? 60 + Math.abs(S.speed) * 5 : 0
    engineOsc.frequency.value += (target - engineOsc.frequency.value) * 0.1
    engineGain.gain.value = S.soundOn ? (S.driving ? 0.05 : 0) : 0
  }
  if (AC && sirenOsc && sirenGain) {
    if (S.wanted > 0 && S.soundOn) {
      S.sirenT += dt
      sirenOsc.frequency.value = Math.floor(S.sirenT / 0.45) % 2 === 0 ? 700 : 950
      sirenGain.gain.value = 0.04
    } else sirenGain.gain.value = 0
  }

  if (S.driving && S.car) {
    const car = S.car
    const stats = VEHICLE_STATS[S.carType] || VEHICLE_STATS.sedan
    if (fwdKey) S.speed += stats.accel * dt
    if (backKey) S.speed -= (S.speed > 0.5 ? stats.brake : 10) * dt
    if (!fwdKey && !backKey) S.speed *= Math.max(0, 1 - 0.8 * dt)
    S.speed = clamp(S.speed, -9, stats.top)
    const steer = (leftKey ? 1 : 0) - (rightKey ? 1 : 0)
    car.rotation.y += steer * clamp(Math.abs(S.speed) / 12, 0, 1) * 1.9 * dt * (S.speed >= 0 ? 1 : -1)
    const f = fwd(car.rotation.y)
    const nx = car.position.x + f.x * S.speed * dt
    const nz = car.position.z + f.z * S.speed * dt
    if (collideCircle(nx, nz, 1.7)) { S.speed *= -0.25; blip(90, 0.1, 0.15) }
    else { car.position.x = clamp(nx, -195, 195); car.position.z = clamp(nz, -195, 195) }
    car.userData.wheels.forEach((w) => { w.rotation.x += S.speed * dt / 0.38 })
    for (const other of [...traffic.map((t) => t), ...police.map((p) => p.car), ...rivals.map((r) => r.car)]) {
      const dx = car.position.x - other.position.x, dz = car.position.z - other.position.z
      const d2 = dx * dx + dz * dz
      if (d2 < 3.4 * 3.4 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        car.position.x += dx / d * (3.4 - d) * 0.5; car.position.z += dz / d * (3.4 - d) * 0.5
        if (Math.abs(S.speed) > 8 && S.ramCooldown === 0) {
          S.wanted = Math.min(4, S.wanted + 1); S.ramCooldown = 3
          banner('WANTED LEVEL UP!'); blip(120, 0.2, 0.2)
        }
        S.speed *= 0.5
      }
    }
    // running over a pedestrian: knockdown + heat
    for (const p of peds) {
      if (p.downT > 0) continue
      const d = Math.hypot(car.position.x - p.mesh.position.x, car.position.z - p.mesh.position.z)
      if (d < 1.4 && Math.abs(S.speed) > 2) {
        p.downT = 3; p.mesh.rotation.z = Math.PI / 2; p.mesh.position.y = 0.4
        if (S.ramCooldown === 0) { S.wanted = Math.min(4, S.wanted + 1); S.ramCooldown = 3; banner('WANTED LEVEL UP!') }
      }
    }
  } else {
    const camFwd = S.camAngle + Math.PI
    const ix = (rightKey ? 1 : 0) - (leftKey ? 1 : 0)
    const iz = (backKey ? 1 : 0) - (fwdKey ? 1 : 0)
    if (ix || iz) {
      const len = Math.hypot(ix, iz)
      const wx = (Math.sin(camFwd) * (-iz) + Math.cos(camFwd) * ix) / len
      const wz = (Math.cos(camFwd) * (-iz) - Math.sin(camFwd) * ix) / len
      const sp = run ? 9 : 5.5
      const nx = player.position.x + wx * sp * dt
      const nz = player.position.z + wz * sp * dt
      const hit = collideCircle(nx, nz, 0.6)
      if (!hit) { player.position.x = clamp(nx, -195, 195); player.position.z = clamp(nz, -195, 195) }
      else {
        if (!collideCircle(nx, player.position.z, 0.6)) player.position.x = clamp(nx, -195, 195)
        if (!collideCircle(player.position.x, nz, 0.6)) player.position.z = clamp(nz, -195, 195)
      }
      S.heading = Math.atan2(wx, wz)
      player.rotation.y = S.heading
      const bob = Math.sin(S.time * (run ? 14 : 10)) * 0.45
      player.userData.legs[0].rotation.x = bob; player.userData.legs[1].rotation.x = -bob
    } else {
      player.userData.legs[0].rotation.x = 0; player.userData.legs[1].rotation.x = 0
    }
    if (keys.Space && S.grounded) { S.vy = 7; S.grounded = false }
    if (!S.grounded) {
      S.vy -= 20 * dt; player.position.y += S.vy * dt
      if (player.position.y <= 0) { player.position.y = 0; S.grounded = true; S.vy = 0 }
    }
  }

  // Fixer marker bob
  fixerMark.position.y = 3.2 + Math.sin(S.time * 2) * 0.3
  fixerMark.rotation.y += dt

  // pedestrians
  const playerCar = S.driving && S.car ? S.car : null
  for (const p of peds) {
    if (p.downT > 0) {
      p.downT -= dt
      if (p.downT <= 0) {
        const [cx, cz] = pedBlock()
        p.corners = [[cx - 21.5, cz - 21.5], [cx + 21.5, cz - 21.5], [cx + 21.5, cz + 21.5], [cx - 21.5, cz + 21.5]]
        p.wp = 0
        p.mesh.position.set(p.corners[0][0], 0, p.corners[0][1])
        p.mesh.rotation.z = 0
      }
      continue
    }
    let tx, tz, sp = 2.2
    if (p.fleeT > 0) p.fleeT -= dt
    if (p.fleeT > 0 && playerCar) {
      tx = p.mesh.position.x + (p.mesh.position.x - playerCar.position.x)
      tz = p.mesh.position.z + (p.mesh.position.z - playerCar.position.z)
      sp = 7
    } else {
      if (playerCar && Math.abs(S.speed) > 4) {
        const d = Math.hypot(playerCar.position.x - p.mesh.position.x, playerCar.position.z - p.mesh.position.z)
        if (d < 8) p.fleeT = 2
      }
      const wp = p.corners[p.wp]
      tx = wp[0]; tz = wp[1]
      if (Math.hypot(tx - p.mesh.position.x, tz - p.mesh.position.z) < 1) { p.wp = (p.wp + 1) % 4; continue }
    }
    const dx = tx - p.mesh.position.x, dz = tz - p.mesh.position.z
    const d = Math.hypot(dx, dz) || 1
    p.mesh.rotation.y = lerpAngle(p.mesh.rotation.y, Math.atan2(dx, dz), 1 - Math.pow(0.001, dt))
    p.mesh.position.x += dx / d * sp * dt
    p.mesh.position.z += dz / d * sp * dt
    const bob = Math.sin(S.time * 9 + p.bob) * 0.4
    p.mesh.userData.legs[0].rotation.x = bob; p.mesh.userData.legs[1].rotation.x = -bob
  }

  // traffic loops
  for (const t of traffic) {
    const wp = t.userData.route[t.userData.wp]
    const dx = wp[0] - t.position.x, dz = wp[1] - t.position.z
    const d = Math.hypot(dx, dz)
    if (d < 3) { t.userData.wp = (t.userData.wp + 1) % t.userData.route.length; continue }
    const target = Math.atan2(dx, dz)
    t.rotation.y = lerpAngle(t.rotation.y, target, 1 - Math.pow(0.001, dt))
    const f = fwd(t.rotation.y)
    t.position.x += f.x * t.userData.speed * dt
    t.position.z += f.z * t.userData.speed * dt
    t.userData.wheels.forEach((w) => { w.rotation.x += t.userData.speed * dt / 0.38 })
  }

  // race rivals
  if (S.mission && S.mission.def.type === 'race') {
    const m = S.mission.def
    const focus = S.driving && S.car ? S.car.position : player.position
    const focusNext = S.mission.playerNext
    if (focusNext < m.gates.length) {
      const g = m.gates[focusNext]
      if (Math.hypot(g[0] - focus.x, g[1] - focus.z) < 7) {
        S.mission.playerNext++
        paintGates(S.mission.playerNext)
        blip(880, 0.15, 0.2)
        if (S.mission.playerNext >= m.gates.length) {
          const pos = racePosition()
          completeMission(m.rewards[pos - 1] || 150)
          banner(`P${pos}! ${m.name} — +$${m.rewards[pos - 1] || 150}`, 4000)
          return
        }
      }
    }
    const myProg = raceProgress(focus, S.mission.playerNext, m.gates)
    for (const r of rivals) {
      if (r.next >= m.gates.length) continue
      const g = m.gates[r.next]
      const dx = g[0] - r.car.position.x, dz = g[1] - r.car.position.z
      const d = Math.hypot(dx, dz)
      if (d < 8) { r.next++; continue }
      const rProg = raceProgress(r.car.position, r.next, m.gates)
      let sp = 15
      if (rProg < myProg - 300) sp = 19
      if (rProg > myProg + 300) sp = 13
      r.car.rotation.y = lerpAngle(r.car.rotation.y, Math.atan2(dx, dz), 1 - Math.pow(0.001, dt))
      const f = fwd(r.car.rotation.y)
      // axis-separated movement slides around buildings instead of sticking
      const stepX = f.x * sp * dt, stepZ = f.z * sp * dt
      if (!collideCircle(r.car.position.x + stepX, r.car.position.z, 1.7)) r.car.position.x = clamp(r.car.position.x + stepX, -195, 195)
      if (!collideCircle(r.car.position.x, r.car.position.z + stepZ, 1.7)) r.car.position.z = clamp(r.car.position.z + stepZ, -195, 195)
      r.car.userData.wheels.forEach((w) => { w.rotation.x += sp * dt / 0.38 })
      // unstick: reversing briefly if barely moving
      const moved = Math.hypot(r.car.position.x - r.lastX, r.car.position.z - r.lastZ)
      r.lastX = r.car.position.x; r.lastZ = r.car.position.z
      if (moved < sp * dt * 0.25) { r.stuckT += dt; if (r.stuckT > 1) { r.revT = 0.8; r.stuckT = 0 } }
      else r.stuckT = 0
      if (r.revT > 0) {
        r.revT -= dt
        r.car.position.x -= f.x * 8 * dt; r.car.position.z -= f.z * 8 * dt
        r.car.rotation.y += 1.5 * dt
      }
    }
  }

  // wanted + police
  if (S.wanted > 0) {
    while (police.length < Math.min(S.wanted, 4)) spawnPolice()
    let nearest = 1e9
    for (const p of police) {
      const target = S.driving && S.car ? S.car.position : player.position
      const dx = target.x - p.car.position.x, dz = target.z - p.car.position.z
      const d = Math.hypot(dx, dz); nearest = Math.min(nearest, d)
      const sp = 15 + S.wanted * 2
      p.car.rotation.y = lerpAngle(p.car.rotation.y, Math.atan2(dx, dz), 1 - Math.pow(0.001, dt))
      const f = fwd(p.car.rotation.y)
      const nx = p.car.position.x + f.x * sp * dt, nz = p.car.position.z + f.z * sp * dt
      if (!collideCircle(nx, nz, 1.7)) { p.car.position.x = clamp(nx, -195, 195); p.car.position.z = clamp(nz, -195, 195) }
      p.car.userData.wheels.forEach((w) => { w.rotation.x += sp * dt / 0.38 })
      const flash = Math.sin(S.time * 12) > 0
      if (p.car.userData.flash) {
        p.car.userData.flash[0].material.emissiveIntensity = flash ? 5 : 0.4
        p.car.userData.flash[1].material.emissiveIntensity = flash ? 0.4 : 5
      }
      if (d < 3 && Math.abs(S.speed) < 3) { p.bustedHold += dt; if (p.bustedHold > 2.5) { busted(); return } }
      else p.bustedHold = Math.max(0, p.bustedHold - dt)
    }
    if (nearest > 55) { S.hideTimer += dt; if (S.hideTimer > 12) { S.wanted--; S.hideTimer = 0; banner('HEAT DYING DOWN…') } }
    else S.hideTimer = 0
  } else if (police.length) {
    for (const p of police) scene.remove(p.car)
    police.length = 0
  }

  // goto / getaway missions
  if (S.mission && S.mission.def.type !== 'race') {
    const m = S.mission.def
    if (S.mission.t) {
      S.mission.t -= dt
      if (S.mission.t <= 0) { failMission('MISSION FAILED — too slow'); return }
    }
    const focus = S.driving && S.car ? S.car.position : player.position
    const d = Math.hypot(m.target[0] - focus.x, m.target[1] - focus.z)
    if (d < 9) completeMission(m.reward)
  }
}

function updateCamera (dt) {
  const focus = S.driving && S.car ? S.car.position : player.position
  const focusH = S.driving && S.car ? S.car.rotation.y : S.heading
  if (!S.driving) player.visible = S.camMode !== 1
  let dist, height, fov
  if (S.camMode === 2) {
    S.camAngle += dt * 0.12
    dist = 9; height = 1.8; fov = 62
  } else if (S.camMode === 1) {
    S.camAngle = lerpAngle(S.camAngle, focusH + Math.PI + S.dragOffset, 1 - Math.pow(0.0001, dt))
    dist = S.driving ? 2.5 : 0.6; height = S.driving ? 1.6 : 1.7; fov = 60
  } else {
    S.camAngle = lerpAngle(S.camAngle, focusH + Math.PI + S.dragOffset, 1 - Math.pow(0.001, dt))
    dist = S.driving ? 9.5 : 6.5; height = S.driving ? 3.8 : 2.8; fov = 55
  }
  if (S.driving) fov += clamp(Math.abs(S.speed) / 26, 0, 1) * 12
  const cx = focus.x + Math.sin(S.camAngle) * dist
  const cz = focus.z + Math.cos(S.camAngle) * dist
  camera.position.set(cx, focus.y + height, cz)
  camera.lookAt(focus.x, focus.y + 1.2, focus.z)
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * 0.1; camera.updateProjectionMatrix() }
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

animate()
