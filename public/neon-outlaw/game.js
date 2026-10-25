/* NEON OUTLAW — Part 1: open-city walk + drive + wanted + getaway mission.
   Original game inspired by the GTA formula (third-person open world, wanted
   stars, police chases, missions) — no Rockstar assets, names, map or code. */
import * as THREE from 'three'
import { buildCity, buildCar, buildPlayer } from './models.js'

const $ = (id) => document.getElementById(id)
const ROAD_LINES = [-135, -81, -27, 27, 81, 135]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerpAngle = (a, b, t) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

// ---------- scene ----------
const container = $('game-container')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.setSize(innerWidth, innerHeight)
container.appendChild(renderer.domElement)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050514)
scene.fog = new THREE.Fog(0x050514, 60, 230)
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500)
scene.add(new THREE.HemisphereLight(0x8899ff, 0x220022, 0.8))
const sun = new THREE.DirectionalLight(0xaaaaff, 0.7)
sun.position.set(50, 100, 30)
scene.add(sun)

const { colliders } = buildCity(scene)

// ---------- entities ----------
const player = buildPlayer()
player.position.set(0, 0, 0)
scene.add(player)

const CAR_COLORS = [0xFF2DA6, 0x00F5FF, 0xFFD23F, 0x4DFF88, 0xFF5533, 0xE8E8E8]
const parked = []
function addParked (x, z, heading) {
  const car = buildCar(CAR_COLORS[parked.length % CAR_COLORS.length])
  car.position.set(x, 0, z); car.rotation.y = heading
  car.userData.parked = true
  scene.add(car); parked.push(car)
  return car
}
addParked(3, 3, Math.PI / 2) // hero car, right by spawn, facing the open plaza road — E to drive instantly
addParked(-30, -27, 0); addParked(40, 27, Math.PI / 2); addParked(-70, 81, -Math.PI / 2); addParked(90, -81, 0)

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
  if (police.length >= 3) return
  const car = buildCar(0xFFFFFF, true)
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2, d = 65 + Math.random() * 20
    const x = clamp(player.position.x + Math.sin(a) * d, -140, 140)
    const z = clamp(player.position.z + Math.cos(a) * d, -140, 140)
    if (!collideCircle(x, z, 2)) { car.position.set(x, 0, z); break }
    car.position.set(x, 0, z) // last try wins even if tight
  }
  scene.add(car); police.push({ car, bustedHold: 0 })
}

// checkpoint beacon
const beacon = new THREE.Group()
const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 22, 12), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFD23F, emissiveIntensity: 2, transparent: true, opacity: 0.35 }))
pillar.position.y = 11
const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFD23F, emissiveIntensity: 2 }))
beacon.add(pillar, beaconBase)
beacon.visible = false
scene.add(beacon)

// ---------- state ----------
const S = {
  running: false, paused: false,
  driving: false, car: null,
  heading: 0, speed: 0, vy: 0, grounded: true,
  camMode: 0, camAngle: Math.PI, dragOffset: 0,
  wanted: 0, hideTimer: 0, ramCooldown: 0,
  cash: Number(localStorage.getItem('neon-outlaw-cash') || 0),
  mission: null, bannerT: 0, time: 0,
}
window.__NO = S // test hook for the browser verification run
window.__NO.colliders = colliders
const keys = {}
const touch = { x: 0, y: 0, gas: false, brake: false }

// ---------- input ----------
addEventListener('keydown', (e) => {
  keys[e.code] = true
  if (!S.running || S.paused) return
  if (e.code === 'KeyE') tryEnterExit()
  if (e.code === 'KeyC') setCamMode(S.camMode === 2 ? 0 : 2)
  if (e.code === 'KeyV') setCamMode((S.camMode + 1) % 3)
  if (e.code === 'KeyM') startMission()
  if (e.code === 'KeyP') togglePause()
})
addEventListener('keyup', (e) => { keys[e.code] = false })
function setCamMode (m) {
  S.camMode = m
  $('bar-top').classList.toggle('hidden', m !== 2)
  $('bar-bottom').classList.toggle('hidden', m !== 2)
}
function togglePause () {
  S.paused = !S.paused
  showOverlay('paused')
}
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
  S.running = true
})

// drag to orbit camera
let dragging = false, lastX = 0
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX })
addEventListener('pointermove', (e) => { if (dragging) { S.dragOffset += (e.clientX - lastX) * 0.005; lastX = e.clientX } })
addEventListener('pointerup', () => { dragging = false })

// touch joystick + buttons
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
function banner (text, ms = 2600) {
  $('banner').textContent = text
  S.bannerT = ms / 1000
}
function tryEnterExit () {
  if (S.driving) {
    // exit: step out to the car's right side
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
  S.driving = true; S.car = best; S.speed = 0
  banner('CAR JACKED — DRIVE!')
}
function startMission () {
  if (S.mission) { banner('MISSION ALREADY RUNNING'); return }
  const tx = (player.position.x > 0 ? -1 : 1) * 120
  const tz = (player.position.z > 0 ? -1 : 1) * 120
  beacon.position.set(tx, 0, tz)
  beacon.visible = true
  S.mission = { t: 75, x: tx, z: tz }
  if (S.wanted < 2) { S.wanted = 2 }
  banner('GETAWAY! Reach the beacon in 75s — and lose the heat!')
}
function respawn () {
  $('overlay').classList.add('hidden')
  player.position.set(0, 0, 0); player.visible = true
  S.driving = false; S.car = null; S.speed = 0; S.wanted = 0; S.mission = null
  beacon.visible = false
  for (const p of police) scene.remove(p.car)
  police.length = 0
  S.paused = false
}
function busted () {
  S.paused = true
  showOverlay('busted')
}

// ---------- HUD / minimap ----------
const mm = $('minimap').getContext('2d')
function drawMinimap () {
  const W = 150, sc = W / 300
  mm.clearRect(0, 0, W, W)
  mm.fillStyle = 'rgba(10,10,25,0.9)'; mm.beginPath(); mm.arc(75, 75, 75, 0, 7); mm.fill()
  mm.save(); mm.beginPath(); mm.arc(75, 75, 75, 0, 7); mm.clip()
  mm.strokeStyle = 'rgba(255,255,255,0.25)'
  for (const c of ROAD_LINES) {
    mm.beginPath(); mm.moveTo(0, (c + 150) * sc); mm.lineTo(W, (c + 150) * sc); mm.stroke()
    mm.beginPath(); mm.moveTo((c + 150) * sc, 0); mm.lineTo((c + 150) * sc, W); mm.stroke()
  }
  mm.fillStyle = 'rgba(120,140,220,0.5)'
  for (const c of colliders) mm.fillRect((c.minX + 150) * sc, (c.minZ + 150) * sc, (c.maxX - c.minX) * sc, (c.maxZ - c.minZ) * sc)
  const dot = (x, z, col, r = 3) => { mm.fillStyle = col; mm.beginPath(); mm.arc((x + 150) * sc, (z + 150) * sc, r, 0, 7); mm.fill() }
  if (beacon.visible) dot(S.mission ? S.mission.x : beacon.position.x, S.mission ? S.mission.z : beacon.position.z, '#FFD23F', 5)
  for (const t of traffic) dot(t.position.x, t.position.z, '#888888', 2)
  for (const p of police) dot(p.car.position.x, p.car.position.z, '#FF3333', 3)
  const px = (player.position.x + 150) * sc, pz = (player.position.z + 150) * sc
  const focus = S.driving && S.car ? S.car : player
  mm.save(); mm.translate(px, pz); mm.rotate(-focus.rotation.y); mm.fillStyle = '#FFFFFF'
  mm.beginPath(); mm.moveTo(0, -6); mm.lineTo(4, 5); mm.lineTo(-4, 5); mm.closePath(); mm.fill(); mm.restore()
  mm.restore()
}
let lastStars = '', lastCash = -1, lastMode = ''
function updateHUD () {
  const stars = '★'.repeat(S.wanted) + '☆'.repeat(3 - S.wanted)
  if (stars !== lastStars) { $('wanted').textContent = stars; lastStars = stars }
  if (S.cash !== lastCash) { $('cash').textContent = '$' + S.cash.toLocaleString(); lastCash = S.cash }
  const mode = S.driving ? 'DRIVING' : 'ON FOOT'
  if (mode !== lastMode) { $('mode').textContent = mode; lastMode = mode }
  $('speed').innerHTML = Math.round(Math.abs(S.speed) * 3.6) + '<span>KM/H</span>'
  $('mission-timer').textContent = S.mission ? 'GETAWAY ' + Math.ceil(S.mission.t) + 's' : ''
  if (S.bannerT <= 0) $('banner').textContent = ''
}

// ---------- main loop ----------
const clock = new THREE.Clock()
function animate () {
  requestAnimationFrame(animate)
  // Clamp at 0.1s (not 0.05): on a slow device the game should get choppy,
  // not run in slow motion, until frames genuinely exceed 100ms.
  const dt = Math.min(clock.getDelta(), 0.1)
  S.time += dt
  if (S.running && !S.paused) update(dt)
  updateCamera(dt)
  drawMinimap()
  updateHUD()
  renderer.render(scene, camera)
}
function fwd (h) { return { x: Math.sin(h), z: Math.cos(h) } }
function update (dt) {
  const fwdKey = keys.KeyW || keys.ArrowUp || touch.y < -0.3 || touch.gas
  const backKey = keys.KeyS || keys.ArrowDown || touch.y > 0.3 || touch.brake
  const leftKey = keys.KeyA || keys.ArrowLeft || touch.x < -0.3
  const rightKey = keys.KeyD || keys.ArrowRight || touch.x > 0.3
  const run = keys.ShiftLeft || keys.ShiftRight
  S.ramCooldown = Math.max(0, S.ramCooldown - dt)

  if (S.driving && S.car) {
    const car = S.car
    if (fwdKey) S.speed += 16 * dt
    if (backKey) S.speed -= (S.speed > 0.5 ? 26 : 10) * dt
    if (!fwdKey && !backKey) S.speed *= Math.max(0, 1 - 0.8 * dt)
    S.speed = clamp(S.speed, -9, 26)
    const steer = (leftKey ? 1 : 0) - (rightKey ? 1 : 0)
    car.rotation.y += steer * clamp(Math.abs(S.speed) / 12, 0, 1) * 1.9 * dt * (S.speed >= 0 ? 1 : -1)
    const f = fwd(car.rotation.y)
    const nx = car.position.x + f.x * S.speed * dt
    const nz = car.position.z + f.z * S.speed * dt
    if (collideCircle(nx, nz, 1.7)) { S.speed *= -0.25 }
    else { car.position.x = clamp(nx, -148, 148); car.position.z = clamp(nz, -148, 148) }
    car.userData.wheels.forEach((w) => { w.rotation.x += S.speed * dt / 0.38 })
    // car-car bumps
    for (const other of [...traffic.map((t) => t), ...police.map((p) => p.car)]) {
      const dx = car.position.x - other.position.x, dz = car.position.z - other.position.z
      const d2 = dx * dx + dz * dz
      if (d2 < 3.4 * 3.4 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        car.position.x += dx / d * (3.4 - d) * 0.5; car.position.z += dz / d * (3.4 - d) * 0.5
        if (Math.abs(S.speed) > 8 && S.ramCooldown === 0) {
          S.wanted = Math.min(3, S.wanted + 1); S.ramCooldown = 3
          banner('WANTED LEVEL UP!')
        }
        S.speed *= 0.5
      }
    }
  } else {
    // on foot — move relative to camera angle
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
      if (!hit) { player.position.x = clamp(nx, -148, 148); player.position.z = clamp(nz, -148, 148) }
      else { // slide: try axes separately
        if (!collideCircle(nx, player.position.z, 0.6)) player.position.x = clamp(nx, -148, 148)
        if (!collideCircle(player.position.x, nz, 0.6)) player.position.z = clamp(nz, -148, 148)
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

  // wanted + police
  if (S.wanted > 0) {
    while (police.length < Math.min(S.wanted, 3)) spawnPolice()
    let nearest = 1e9
    for (const p of police) {
      const target = S.driving && S.car ? S.car.position : player.position
      const dx = target.x - p.car.position.x, dz = target.z - p.car.position.z
      const d = Math.hypot(dx, dz); nearest = Math.min(nearest, d)
      const sp = 15 + S.wanted * 2
      p.car.rotation.y = lerpAngle(p.car.rotation.y, Math.atan2(dx, dz), 1 - Math.pow(0.001, dt))
      const f = fwd(p.car.rotation.y)
      const nx = p.car.position.x + f.x * sp * dt, nz = p.car.position.z + f.z * sp * dt
      if (!collideCircle(nx, nz, 1.7)) { p.car.position.x = clamp(nx, -148, 148); p.car.position.z = clamp(nz, -148, 148) }
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

  // mission
  if (S.mission) {
    S.mission.t -= dt
    const focus = S.driving && S.car ? S.car.position : player.position
    const d = Math.hypot(S.mission.x - focus.x, S.mission.z - focus.z)
    if (d < 9) {
      S.cash += 500
      localStorage.setItem('neon-outlaw-cash', String(S.cash))
      S.mission = null; beacon.visible = false
      banner('MISSION PASSED! +$500', 4000)
    } else if (S.mission.t <= 0) {
      S.mission = null; beacon.visible = false
      banner('MISSION FAILED — too slow', 4000)
    }
  }
  if (S.bannerT > 0) S.bannerT -= dt
}

function updateCamera (dt) {
  const focus = S.driving && S.car ? S.car.position : player.position
  if (!S.driving) player.visible = S.camMode !== 1 // first-person view hides the body
  const focusH = S.driving && S.car ? S.car.rotation.y : S.heading
  let dist, height, fov
  if (S.camMode === 2) { // cinematic: slow orbit, low angle
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
