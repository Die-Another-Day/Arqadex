/* NEON OUTLAW — code-built original models.
   Every mesh here is procedural low-poly geometry: no copied assets, no
   Rockstar content, no textures downloaded from anywhere. */
import * as THREE from 'three'

const BLOCK = 40, ROAD = 14, P = BLOCK + ROAD // city pitch
const RAND = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()

export function buildCity (scene) {
  const colliders = []
  const roadLines = [-135, -81, -27, 27, 81, 135]

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 320),
    new THREE.MeshStandardMaterial({ color: 0x0b0b18, roughness: 1 })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // road strips (slightly raised so dashes read)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 1 })
  for (const c of roadLines) {
    for (const horiz of [true, false]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(horiz ? 300 : ROAD, 0.1, horiz ? ROAD : 300), roadMat)
      strip.position.set(horiz ? 0 : c, 0.05, horiz ? c : 0)
      scene.add(strip)
    }
  }

  // sidewalk slabs per block
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x232338, roughness: 1 })
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(BLOCK, 0.2, BLOCK), walkMat)
      slab.position.set(i * P, 0.1, j * P)
      scene.add(slab)
    }
  }

  // buildings — one InstancedMesh, colour-varied
  const placements = []
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i === 0 && j === 0) continue // central plaza stays open (spawn)
      const cx = i * P, cz = j * P
      const n = 1 + Math.floor(RAND() * 2) // 1-2 towers per block
      for (let k = 0; k < n; k++) {
        const w = 10 + RAND() * 10, d = 10 + RAND() * 10
        const ox = n === 1 ? 0 : (k === 0 ? -9 : 9)
        const oz = n === 1 ? 0 : (k === 0 ? -9 : 9)
        const h = 8 + RAND() * 30
        const x = cx + ox, z = cz + oz
        placements.push({ x, z, w, h, d })
        colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 })
      }
    }
  }
  const box = new THREE.BoxGeometry(1, 1, 1)
  const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  const inst = new THREE.InstancedMesh(box, bMat, placements.length)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3()
  const palette = [0x2a2a4a, 0x35355c, 0x1e2a44, 0x3a2a4a, 0x222233]
  placements.forEach((p, idx) => {
    pos.set(p.x, p.h / 2 + 0.2, p.z); sc.set(p.w, p.h, p.d)
    m.compose(pos, q, sc); inst.setMatrixAt(idx, m)
    inst.setColorAt(idx, new THREE.Color(palette[Math.floor(RAND() * palette.length)]))
  })
  inst.instanceColor.needsUpdate = true
  scene.add(inst)

  // rooftop boxes + neon signs on some towers
  const signCols = [0xFF2DA6, 0x00F5FF, 0xFFD23F, 0x4DFF88]
  placements.forEach((p) => {
    if (RAND() < 0.35) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 3 + RAND() * 5, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: signCols[Math.floor(RAND() * signCols.length)], emissiveIntensity: 2 })
      )
      sign.position.set(p.x + p.w / 2 + 0.4, p.h * 0.7, p.z)
      scene.add(sign)
    }
  })

  // street lamps along roads (instanced poles + emissive heads)
  const lampPts = []
  for (const c of roadLines) for (let t = -130; t <= 130; t += 27) { lampPts.push([c + 8, t]); lampPts.push([t, c + 8]) }
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }), lampPts.length)
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00F5FF, emissiveIntensity: 2.5 }), lampPts.length)
  lampPts.forEach(([x, z], idx) => {
    m.compose(pos.set(x, 2.5, z), q, sc.set(1, 1, 1)); pole.setMatrixAt(idx, m)
    m.compose(pos.set(x, 5.1, z), q, sc.set(1, 1, 1)); head.setMatrixAt(idx, m)
  })
  scene.add(pole); scene.add(head)

  // plaza props at spawn (crates to dodge, not colliders — kept soft)
  return { colliders, half: 150 }
}

export function buildCar (color, police = false) {
  const g = new THREE.Group()
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.2), paint)
  body.position.y = 0.55; g.add(body)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.2, metalness: 0.6 }))
  cabin.position.set(0, 1.15, -0.2); g.add(cabin)
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12)
  wheelGeo.rotateZ(Math.PI / 2)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
  const wheels = []
  for (const [x, z] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, 0.38, z); g.add(w); wheels.push(w)
  }
  const hl = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xFFFFCC, emissiveIntensity: 3 })
  for (const x of [-0.6, 0.6]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), hl); h.position.set(x, 0.6, 2.12); g.add(h) }
  if (police) {
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0x110000, emissive: 0xFF0000, emissiveIntensity: 4 }))
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0x000011, emissive: 0x0044FF, emissiveIntensity: 4 }))
    barR.position.set(-0.4, 1.55, -0.2); barB.position.set(0.4, 1.55, -0.2); g.add(barR); g.add(barB)
    g.userData.flash = [barR, barB]
  }
  g.userData.wheels = wheels
  return g
}

export function buildPlayer () {
  const g = new THREE.Group()
  const jacket = new THREE.MeshStandardMaterial({ color: 0x00F5FF, roughness: 0.8 })
  const skin = new THREE.MeshStandardMaterial({ color: 0xE8B88A, roughness: 0.8 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 })
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), jacket); torso.position.y = 1.15; g.add(torso)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skin); head.position.y = 1.8; g.add(head)
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0xFF2DA6 })); cap.position.y = 2.05; g.add(cap)
  const legs = []
  for (const x of [-0.18, 0.18]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.3), dark); l.position.set(x, 0.38, 0); g.add(l); legs.push(l) }
  g.userData.legs = legs
  return g
}
