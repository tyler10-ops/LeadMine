"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = "free" | "miner" | "operator" | "brokerage"

export interface CavePanelProps {
  plan?: Plan
  isRunning?: boolean
}

const MINERS_BY_PLAN: Record<Plan, number> = {
  free: 1,
  miner: 3,
  operator: 5,
  brokerage: 5,
}

// ── Mining wall spots ─────────────────────────────────────────────────────────
// Room: x ∈ [-7, 7], y ∈ [0, 7], z ∈ [-12, 0]

interface MiningSpot {
  position:    THREE.Vector3
  facingAngle: number      // group.rotation.y when mining
  gemPos:      THREE.Vector3
  gemColor:    number
}

const MINING_SPOTS: MiningSpot[] = [
  // Back wall (z ≈ -12), stand at z = -9.8, face Math.PI
  { position: new THREE.Vector3(-4.0, 0, -9.8), facingAngle: Math.PI,      gemPos: new THREE.Vector3(-4.0, 2.5, -11.6), gemColor: 0x00ff88 },
  { position: new THREE.Vector3(-1.5, 0, -9.8), facingAngle: Math.PI,      gemPos: new THREE.Vector3(-1.5, 2.5, -11.6), gemColor: 0xffd60a },
  { position: new THREE.Vector3( 1.5, 0, -9.8), facingAngle: Math.PI,      gemPos: new THREE.Vector3( 1.5, 2.5, -11.6), gemColor: 0xff4040 },
  { position: new THREE.Vector3( 4.0, 0, -9.8), facingAngle: Math.PI,      gemPos: new THREE.Vector3( 4.0, 2.5, -11.6), gemColor: 0x00ccff },
  // Left wall (x ≈ -7), stand at x = -4.8, face -PI/2
  { position: new THREE.Vector3(-4.8, 0, -4.0), facingAngle: -Math.PI / 2, gemPos: new THREE.Vector3(-6.8, 2.5, -4.0),  gemColor: 0xff88ff },
  { position: new THREE.Vector3(-4.8, 0, -8.0), facingAngle: -Math.PI / 2, gemPos: new THREE.Vector3(-6.8, 2.5, -8.0),  gemColor: 0x00ff88 },
  // Right wall (x ≈ 7), stand at x = 4.8, face PI/2
  { position: new THREE.Vector3( 4.8, 0, -4.0), facingAngle:  Math.PI / 2, gemPos: new THREE.Vector3( 6.8, 2.5, -4.0),  gemColor: 0xffd60a },
  { position: new THREE.Vector3( 4.8, 0, -8.0), facingAngle:  Math.PI / 2, gemPos: new THREE.Vector3( 6.8, 2.5, -8.0),  gemColor: 0xff4040 },
]

const HELMET_COLORS = [0xffd60a, 0x44bb66, 0xff6b35, 0x60a5fa, 0xff88cc]

// Bunk positions — miners sleep here when idle (right-wall corner, near front)
// rx=-PI/2 lays the miner flat on their back; ry=0 faces them up
interface BunkSlot { x: number; y: number; z: number; rx: number; ry: number }
const BUNK_SLOTS: BunkSlot[] = [
  { x: 5.85, y: 0.54, z: -2.1, rx: -Math.PI / 2, ry: 0 }, // bottom bunk
  { x: 5.85, y: 1.22, z: -2.1, rx: -Math.PI / 2, ry: 0 }, // top bunk
  { x: 4.8,  y: 0,   z: -1.4, rx: 0, ry:  Math.PI / 2 }, // beside bed
  { x: 4.8,  y: 0,   z: -2.5, rx: 0, ry:  Math.PI / 2 }, // beside bed
  { x: 4.8,  y: 0,   z: -3.2, rx: 0, ry:  Math.PI / 2 }, // beside bed
]

function randFloat(min: number, max: number) { return min + Math.random() * (max - min) }
function randInt(min: number, max: number)   { return Math.floor(randFloat(min, max)) }

// ── Miner state ───────────────────────────────────────────────────────────────

type MinerState = "mining" | "walking"

interface MinerAgent {
  group:        THREE.Group
  torso:        THREE.Mesh
  armLGroup:    THREE.Group
  armRGroup:    THREE.Group
  legLGroup:    THREE.Group
  legRGroup:    THREE.Group
  state:        MinerState
  resting:      boolean
  bunkSlot:     number
  spotIndex:    number
  targetSpot:   MiningSpot
  miningTimer:  number
  swingPhase:   number
  walkFromX:    number
  walkFromZ:    number
  walkProgress: number
  walkSpeed:    number
  walkPhase:    number
  sparks:       THREE.Points | null
  sparkTimer:   number
}

interface GemCluster {
  light: THREE.PointLight
  mats:  THREE.MeshLambertMaterial[]
  phase: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CavePanel({ plan = "miner", isRunning = true }: CavePanelProps) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const runningRef = useRef(isRunning)
  useEffect(() => { runningRef.current = isRunning }, [isRunning])

  const minerCount = MINERS_BY_PLAN[plan]

  // Leads counter — ticks up while mining is active
  const [leadsFound, setLeadsFound] = useState(0)
  useEffect(() => {
    if (!isRunning) return
    const t = setInterval(() => {
      setLeadsFound(n => n + randInt(1, 3))
    }, 7000)
    return () => clearInterval(t)
  }, [isRunning])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = el.clientWidth  || 800
    const H = el.clientHeight || 500

    // ── Renderer — full resolution, antialiased ────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x100c06)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;"
    el.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x100c06)
    scene.fog = new THREE.FogExp2(0x100c06, 0.048)

    // ── Camera — inside the cave entrance, looking straight in ────────────────
    const camera = new THREE.PerspectiveCamera(68, W / H, 0.1, 80)
    camera.position.set(0, 5.5, 4)      // elevated + pulled back for cave overview
    camera.lookAt(0, 1.5, -6)           // looking down into the cave

    // ── Lighting ──────────────────────────────────────────────────────────────
    // Soft warm ambient — dim enough to preserve drama
    scene.add(new THREE.AmbientLight(0x6a4828, 1.8))

    // Key overhead fill — casts soft shadows downward
    const ceilFill = new THREE.DirectionalLight(0xffd090, 1.4)
    ceilFill.position.set(0, 14, 2)
    ceilFill.castShadow = true
    ceilFill.shadow.mapSize.set(2048, 2048)
    ceilFill.shadow.camera.near = 0.5
    ceilFill.shadow.camera.far  = 40
    ceilFill.shadow.camera.left = ceilFill.shadow.camera.bottom = -10
    ceilFill.shadow.camera.right = ceilFill.shadow.camera.top   =  10
    ceilFill.shadow.radius = 3
    scene.add(ceilFill)

    // Subtle front bounce — lifts the near-camera area slightly
    const frontFill = new THREE.DirectionalLight(0xc8843a, 0.5)
    frontFill.position.set(0, 4, 14)
    scene.add(frontFill)

    // Torches placed between gem spots
    const torchLightPts: THREE.Vector3[] = [
      new THREE.Vector3(-6.5, 3.0, -2.5),
      new THREE.Vector3(-6.5, 3.0, -6.0),
      new THREE.Vector3( 6.5, 3.0, -2.5),
      new THREE.Vector3( 6.5, 3.0, -6.0),
      new THREE.Vector3(-5.5, 3.0, -11.7),
      new THREE.Vector3( 5.5, 3.0, -11.7),
    ]
    const torchLights = torchLightPts.map(pos => {
      const l = new THREE.PointLight(0xff7820, 6.0, 16)
      l.position.copy(pos)
      l.castShadow = true
      l.shadow.mapSize.set(512, 512)
      l.shadow.radius = 4
      scene.add(l)
      return l
    })

    // ── Helpers ───────────────────────────────────────────────────────────────
    const lmat = (c: number) => new THREE.MeshLambertMaterial({ color: c })

    const addBox = (
      x: number, y: number, z: number,
      w: number, h: number, d: number,
      color: number,
      shadows = true
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lmat(color))
      m.position.set(x, y, z)
      if (shadows) { m.castShadow = true; m.receiveShadow = true }
      scene.add(m)
      return m
    }

    // ── Room ──────────────────────────────────────────────────────────────────
    // Room depth now runs z: -12 → +0.5 so walls wrap around the camera
    const ROOM_D = 12.5
    const ROOM_CZ = -5.75  // center of depth range

    // Floor slab
    addBox(0, -0.25, ROOM_CZ,   14, 0.5, ROOM_D, 0x2e1e0c)

    // Floor tile color variation
    const fColors = [0x342210, 0x2a1a0a, 0x3a2812, 0x241608]
    for (let tx = -6; tx <= 6; tx += 2) {
      for (let tz = -11; tz <= -1; tz += 2) {
        addBox(
          tx + randFloat(-0.1, 0.1), 0.01, tz + randFloat(-0.1, 0.1),
          1.75, 0.04, 1.75,
          fColors[randInt(0, fColors.length)]
        )
      }
    }

    // ── Cave enclosure (organic rounded cave shell) ───────────────────────────
    // Low-poly sphere rendered from inside gives an organic, rocky cave feel
    const caveShellMat = new THREE.MeshLambertMaterial({ color: 0x2c1a0a, side: THREE.BackSide })
    const caveShellGeo = new THREE.SphereGeometry(12, 7, 5)
    const caveShell    = new THREE.Mesh(caveShellGeo, caveShellMat)
    caveShell.scale.set(1, 0.70, 1.30)   // flatten height, elongate depth
    caveShell.position.set(0, 2.5, -5)
    scene.add(caveShell)

    // Back wall (closes cave at the far end)
    addBox(0, 3.5, -12.25, 14, 7.0, 0.5, 0x3e2e16)

    // Support pillars (mine support structures)
    for (const pz of [-3.5, -8.5]) {
      for (const px of [-5.5, 5.5]) {
        addBox(px, 3.25, pz, 0.35, 6.5, 0.35, 0x1e1008)
      }
    }

    // Back wall protruding voxel blocks (texture)
    const bwBlocks: [number, number][] = [
      [-5, 0.5], [-3, 1.5], [-1, 0.7], [1, 1.2], [3, 0.5], [5, 1.8],
      [-4, 2.5], [0, 2.0], [4, 2.5], [-2, 3.5], [2, 3.0],
    ]
    for (const [bx, by] of bwBlocks) {
      const p = 0.3 + Math.random() * 0.35
      addBox(bx, by + 0.45, -12.25 + p / 2, 0.85, 0.9, p, 0x2e2010)
    }

    // Stalactites (box style — wide-narrow column pairs)
    const stalData: [number, number, number][] = [
      [-3, -1.5, 0.7], [-1, -2.5, 1.1], [1, -1.8, 0.8],  [3, -2.2, 1.0],
      [-4.5, -4, 0.9], [-2, -3.5, 0.6], [0.5, -4.5, 1.2], [2.5, -3, 0.7],
      [-3.5, -7, 0.85],[-1.5, -8, 0.5], [1, -7, 0.7],     [3.5, -6.5, 0.9],
      [-4, -10, 0.8],  [0, -9.5, 1.0],  [4, -10, 0.65],
    ]
    for (const [sx, sz, len] of stalData) {
      addBox(sx, 9 - len / 2, sz, 0.28, len, 0.28, 0x180c04)
      addBox(sx, 9 - len - 0.12, sz, 0.16, 0.24, 0.16, 0x140a02)
    }

    // Rubble piles on floor edges
    const rubData: [number, number, number, number][] = [
      [-6.2, -1.8, 0.50, 0.30], [-6.4, -5.0, 0.40, 0.25], [-6.1, -9.0, 0.55, 0.32],
      [ 6.2, -2.5, 0.45, 0.28], [ 6.4, -6.0, 0.50, 0.30], [ 6.1,-10.0, 0.50, 0.30],
      [-2.0,-11.4, 0.40, 0.22], [ 3.0,-11.2, 0.45, 0.28],
    ]
    for (const [rx, rz, sxz, sy] of rubData) {
      addBox(rx, sy / 2, rz, sxz, sy, sxz, 0x1e1208)
    }

    // ── Gem clusters in walls — crystal materials ─────────────────────────────
    const gemClusters: GemCluster[] = []
    for (const spot of MINING_SPOTS) {
      const col = spot.gemColor
      const clusterMats: THREE.MeshLambertMaterial[] = []
      const crystals: [number, number, number, number, number, number][] = [
        [0.24, 0.36, 0.20,  0,      0,     0   ],
        [0.15, 0.26, 0.13,  0.17,   0.10,  0   ],
        [0.11, 0.30, 0.11, -0.15,   0.15,  0   ],
        [0.13, 0.18, 0.13,  0.07,  -0.08,  0.05],
        [0.09, 0.22, 0.09, -0.07,  -0.10, -0.05],
        [0.07, 0.14, 0.07,  0.12,   0.04, -0.06],
      ]
      for (const [sx, sy, sz, ox, oy, oz] of crystals) {
        // MeshPhysicalMaterial gives real gem refraction & gloss
        const mat = new THREE.MeshPhysicalMaterial({
          color:             col,
          emissive:          col,
          emissiveIntensity: 0.8,
          metalness:         0.0,
          roughness:         0.05,
          transmission:      0.55,
          thickness:         0.4,
          transparent:       true,
          opacity:           0.92,
          envMapIntensity:   1.2,
        }) as unknown as THREE.MeshLambertMaterial  // typed as Lambert for the cluster interface
        clusterMats.push(mat)
        const geo = new THREE.ConeGeometry(Math.max(sx, sz) * 0.6, sy, 6)
        const gm = new THREE.Mesh(geo, mat as unknown as THREE.Material)
        gm.position.set(
          spot.gemPos.x + ox,
          spot.gemPos.y + oy + sy / 2,
          spot.gemPos.z + oz
        )
        gm.rotation.y  = randFloat(0, Math.PI * 2)
        gm.rotation.z  = randFloat(-0.25, 0.25)
        gm.castShadow  = true
        scene.add(gm)
      }
      // Stronger point light so gem lights the surrounding rock
      const gl = new THREE.PointLight(col, 3.0, 7)
      gl.position.copy(spot.gemPos)
      scene.add(gl)
      gemClusters.push({ light: gl, mats: clusterMats, phase: randFloat(0, Math.PI * 2) })
    }

    // ── Torches (box style) ───────────────────────────────────────────────────
    const flameMats: THREE.MeshLambertMaterial[] = []
    const torchDefs: [number, number, number][] = [
      [-6.6, 3.0, -2.5], [-6.6, 3.0, -6.0],
      [ 6.6, 3.0, -2.5], [ 6.6, 3.0, -6.0],
      [-5.5, 3.0,-11.7], [ 5.5, 3.0,-11.7],
    ]
    for (const [tx, ty, tz] of torchDefs) {
      addBox(tx, ty - 0.15, tz, 0.28, 0.08, 0.16, 0x3a2010) // bracket
      addBox(tx, ty + 0.05, tz, 0.10, 0.35, 0.10, 0x5c3317) // shaft
      const fMat = new THREE.MeshLambertMaterial({
        color: 0xff9030, emissive: 0xff6010, emissiveIntensity: 2.0,
      })
      flameMats.push(fMat)
      const flame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), fMat)
      flame.position.set(tx, ty + 0.31, tz)
      scene.add(flame)
    }

    // ── Mine cart track ───────────────────────────────────────────────────────
    for (const xo of [-0.28, 0.28]) {
      addBox(xo, 0.06, -5.5, 0.07, 0.07, 11, 0x7a6040)
    }
    for (let ti = 0; ti < 13; ti++) {
      addBox(0, 0.03, -0.5 - ti * 0.88, 0.70, 0.05, 0.14, 0x2a1506)
    }

    // ── Mine cart ────────────────────────────────────────────────────────────
    // Body panels
    addBox(0,      0.18, -2.5, 0.90, 0.12, 0.60, 0x3a3020) // floor
    addBox(-0.42,  0.40, -2.5, 0.06, 0.36, 0.60, 0x3a3020) // left side
    addBox( 0.42,  0.40, -2.5, 0.06, 0.36, 0.60, 0x3a3020) // right side
    addBox(0,      0.40, -2.2, 0.90, 0.36, 0.06, 0x3a3020) // front
    addBox(0,      0.40, -2.8, 0.90, 0.36, 0.06, 0x3a3020) // back
    // Wheels (flat box approximation)
    for (const [wx, wz] of [[-0.36,-2.22],[0.36,-2.22],[-0.36,-2.78],[0.36,-2.78]]) {
      addBox(wx, 0.14, wz, 0.06, 0.20, 0.20, 0x555040)
    }
    // Ore load
    const oreLoad: [number, number, number][] = [
      [-0.22, 0.68, -2.45, ], [0, 0.70, -2.55], [0.22, 0.68, -2.5],
    ]
    const oreColors = [0x00cc55, 0xffd60a, 0xff4040]
    for (let i = 0; i < oreLoad.length; i++) {
      const [ox, oy, oz] = oreLoad[i]
      const om = new THREE.MeshLambertMaterial({
        color: oreColors[i], emissive: oreColors[i], emissiveIntensity: 0.6,
      })
      const ore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), om)
      ore.position.set(ox, oy, oz)
      scene.add(ore)
    }

    // ── Bunk bed (right wall, near front) ────────────────────────────────────
    // Frame: 4 corner posts + 2 bunk platforms + ladder + pillows
    const woodDark = 0x5a3015
    const woodMid  = 0x6e4020
    // Posts
    for (const [px, pz] of [[5.35,-1.55],[6.35,-1.55],[5.35,-2.65],[6.35,-2.65]]) {
      addBox(px, 0.85, pz, 0.12, 1.70, 0.12, woodDark)
    }
    // Bottom bunk platform (surface at y=0.42)
    addBox(5.85, 0.37, -2.1, 0.90, 0.10, 1.10, woodMid)
    // Top bunk platform (surface at y=1.10)
    addBox(5.85, 1.05, -2.1, 0.90, 0.10, 1.10, woodMid)
    // Side rail on top bunk (safety bar)
    addBox(5.35, 1.22, -2.1, 0.06, 0.22, 1.10, woodDark)
    // Ladder rungs on left post
    for (let r = 0; r < 5; r++) {
      addBox(5.28, 0.28 + r * 0.20, -1.58, 0.16, 0.05, 0.08, woodMid)
    }
    // Pillows (small light boxes at head end of each bunk)
    addBox(5.85, 0.48, -1.68, 0.32, 0.08, 0.22, 0xf0e0c0)
    addBox(5.85, 1.16, -1.68, 0.32, 0.08, 0.22, 0xf0e0c0)
    // Blanket hints (thin flat colored box on each bunk)
    addBox(5.85, 0.44, -2.2, 0.80, 0.05, 0.75, 0x2a4a8c)
    addBox(5.85, 1.12, -2.2, 0.80, 0.05, 0.75, 0x1a3a6e)

    // ── Build miner ───────────────────────────────────────────────────────────
    function buildMiner(helmetColor: number, spot: MiningSpot, spotIndex: number): MinerAgent {
      const root = new THREE.Group()
      const S = 0.45

      const mOveralls = lmat(0x1a3a6e)
      const mSkin     = lmat(0xf5b97a)
      const mHelmet   = lmat(helmetColor)
      const mBoot     = lmat(0x100800)
      const mWood     = lmat(0x7a4e22)
      const mMetal    = lmat(0x8090a0)
      const mLamp     = new THREE.MeshLambertMaterial({ color: 0xfffde0, emissive: 0xfffde0, emissiveIntensity: 3.0 })
      const mEye      = lmat(0x111820)

      const bx = (w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w * S, h * S, d * S), mat)
        m.castShadow = true
        return m
      }

      // Torso (center at y = 0.75*S)
      const torso = bx(0.50, 0.50, 0.32, mOveralls)
      torso.position.set(0, 0.75 * S, 0)
      root.add(torso)

      // Head (center at y = 1.22*S)
      const head = bx(0.44, 0.44, 0.44, mSkin)
      head.position.set(0, 1.22 * S, 0)
      root.add(head)

      // Helmet crown + brim
      const helmetCrown = bx(0.50, 0.20, 0.50, mHelmet)
      helmetCrown.position.set(0, 1.50 * S, 0)
      root.add(helmetCrown)

      const helmetBrim = bx(0.60, 0.06, 0.58, mHelmet)
      helmetBrim.position.set(0, 1.40 * S, 0)
      root.add(helmetBrim)

      // Helmet lamp
      const lamp = bx(0.12, 0.10, 0.08, mLamp)
      lamp.position.set(0, 1.50 * S, 0.27 * S)
      root.add(lamp)

      // Eyes
      for (const ex of [-0.10, 0.10]) {
        const eye = bx(0.08, 0.08, 0.05, mEye)
        eye.position.set(ex * S, 1.22 * S, 0.23 * S)
        root.add(eye)
      }

      // Left arm — pivot at shoulder (x=-0.32*S, y=1.0*S)
      // mesh offset = -halfHeight so rotation swings from shoulder joint
      const armLG = new THREE.Group()
      armLG.position.set(-0.32 * S, 1.0 * S, 0)
      const armLM = bx(0.16, 0.38, 0.20, mOveralls)
      armLM.position.set(0, -0.19 * S, 0)
      armLG.add(armLM)
      root.add(armLG)

      // Right arm — pivot at shoulder (x=+0.32*S, y=1.0*S) + pickaxe
      const armRG = new THREE.Group()
      armRG.position.set(0.32 * S, 1.0 * S, 0)
      const armRM = bx(0.16, 0.38, 0.20, mOveralls)
      armRM.position.set(0, -0.19 * S, 0)
      armRG.add(armRM)

      // Pickaxe (at hand position, below arm end)
      const pickG = new THREE.Group()
      pickG.position.set(0, -0.42 * S, -0.10 * S)
      const pHandle = new THREE.Mesh(new THREE.BoxGeometry(0.06 * S, 0.50 * S, 0.06 * S), mWood)
      pHandle.position.set(0, -0.25 * S, 0)
      pickG.add(pHandle)
      const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.38 * S, 0.09 * S, 0.09 * S), mMetal)
      pickG.add(pHead)
      const pSpike = new THREE.Mesh(new THREE.BoxGeometry(0.06 * S, 0.06 * S, 0.20 * S), mMetal)
      pSpike.position.set(-0.16 * S, 0, -0.08 * S)
      pickG.add(pSpike)
      armRG.add(pickG)
      root.add(armRG)

      // Left leg — pivot at hip (x=-0.14*S, y=0.5*S)
      const legLG = new THREE.Group()
      legLG.position.set(-0.14 * S, 0.5 * S, 0)
      const legLM = bx(0.18, 0.40, 0.20, mOveralls)
      legLM.position.set(0, -0.20 * S, 0)
      legLG.add(legLM)
      const bootL = bx(0.20, 0.12, 0.26, mBoot)
      bootL.position.set(0, -0.44 * S, 0.03 * S)
      legLG.add(bootL)
      root.add(legLG)

      // Right leg — pivot at hip (x=+0.14*S, y=0.5*S)
      const legRG = new THREE.Group()
      legRG.position.set( 0.14 * S, 0.5 * S, 0)
      const legRM = bx(0.18, 0.40, 0.20, mOveralls)
      legRM.position.set(0, -0.20 * S, 0)
      legRG.add(legRM)
      const bootR = bx(0.20, 0.12, 0.26, mBoot)
      bootR.position.set(0, -0.44 * S, 0.03 * S)
      legRG.add(bootR)
      root.add(legRG)

      root.position.copy(spot.position)
      root.rotation.y = spot.facingAngle
      scene.add(root)

      return {
        group: root,
        torso,
        armLGroup: armLG,
        armRGroup: armRG,
        legLGroup: legLG,
        legRGroup: legRG,
        state: "mining",
        spotIndex,
        targetSpot: spot,
        miningTimer: randFloat(3, 10),
        swingPhase: randFloat(0, Math.PI * 2),
        walkFromX: spot.position.x,
        walkFromZ: spot.position.z,
        walkProgress: 1,
        walkSpeed: randFloat(1.5, 2.5),
        walkPhase: 0,
        sparks: null,
        sparkTimer: 0,
        resting: false,
        bunkSlot: 0, // assigned after spawn
      }
    }

    // ── Spawn miners ──────────────────────────────────────────────────────────
    const minerCount  = MINERS_BY_PLAN[plan]
    const shuffled    = [...MINING_SPOTS].sort(() => Math.random() - 0.5)
    const miners: MinerAgent[] = []
    for (let i = 0; i < minerCount; i++) {
      const spot     = shuffled[i % shuffled.length]
      const spotIdx  = MINING_SPOTS.indexOf(spot)
      const miner    = buildMiner(HELMET_COLORS[i % HELMET_COLORS.length], spot, spotIdx)
      miner.bunkSlot = i % BUNK_SLOTS.length
      miners.push(miner)
    }

    // ── Sparks ────────────────────────────────────────────────────────────────
    function spawnSparks(miner: MinerAgent) {
      if (miner.sparks) { scene.remove(miner.sparks); miner.sparks = null }
      const gp = miner.targetSpot.gemPos
      const N = 18
      const pos = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        pos[i * 3]     = gp.x + randFloat(-0.4, 0.4)
        pos[i * 3 + 1] = gp.y + randFloat(-0.3, 0.3)
        pos[i * 3 + 2] = gp.z + randFloat(-0.15, 0.15)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      const sp = new THREE.Points(geo, new THREE.PointsMaterial({
        color: miner.targetSpot.gemColor,
        size: 0.18,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }))
      scene.add(sp)
      miner.sparks = sp
    }

    // ── Pick next spot (avoid current) ────────────────────────────────────────
    function nextSpot(miner: MinerAgent): MiningSpot {
      if (MINING_SPOTS.length <= 1) return MINING_SPOTS[0]
      let idx = miner.spotIndex
      while (idx === miner.spotIndex) {
        idx = randInt(0, MINING_SPOTS.length)
      }
      miner.spotIndex = idx
      return MINING_SPOTS[idx]
    }

    // ── Update miner ─────────────────────────────────────────────────────────
    function updateMiner(miner: MinerAgent, dt: number, _elapsed: number) {
      const running = runningRef.current

      // Paused — send miners to bunk bed
      if (!running) {
        if (miner.sparks) { scene.remove(miner.sparks); miner.sparks = null }
        const slot = BUNK_SLOTS[miner.bunkSlot]
        miner.group.position.set(slot.x, slot.y, slot.z)
        miner.group.rotation.x = slot.rx
        miner.group.rotation.y = slot.ry
        miner.armLGroup.rotation.x = 0
        miner.armRGroup.rotation.x = 0
        miner.legLGroup.rotation.x = 0
        miner.legRGroup.rotation.x = 0
        miner.torso.rotation.x     = 0
        miner.resting = true
        return
      }

      // Just woke up — reset rotation and walk back to a mining spot
      if (miner.resting) {
        miner.resting          = false
        miner.group.rotation.x = 0
        miner.state            = "walking"
        miner.walkFromX        = miner.group.position.x
        miner.walkFromZ        = miner.group.position.z
        miner.walkProgress     = 0
        miner.walkPhase        = 0
        miner.walkSpeed        = randFloat(1.5, 2.5)
      }

      // ── Walking ───────────────────────────────────────────────────────────
      if (miner.state === "walking") {
        const toX = miner.targetSpot.position.x
        const toZ = miner.targetSpot.position.z
        const dx  = toX - miner.walkFromX
        const dz  = toZ - miner.walkFromZ
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist > 0.01) {
          miner.walkProgress = Math.min(1, miner.walkProgress + dt * miner.walkSpeed / dist)
        } else {
          miner.walkProgress = 1
        }

        const p = miner.walkProgress
        miner.group.position.x = miner.walkFromX + dx * p
        miner.group.position.z = miner.walkFromZ + dz * p

        // Face direction of travel
        if (dist > 0.01) {
          miner.group.rotation.y = Math.atan2(dx, dz)
        }

        // Walk animation — legs and arms swing
        miner.walkPhase += dt * 7
        const sw = Math.sin(miner.walkPhase) * 0.55
        miner.legLGroup.rotation.x  =  sw
        miner.legRGroup.rotation.x  = -sw
        miner.armLGroup.rotation.x  = -sw * 0.6
        miner.armRGroup.rotation.x  =  sw * 0.6
        miner.group.position.y      = Math.abs(Math.sin(miner.walkPhase * 0.5)) * 0.08

        // Arrived
        if (miner.walkProgress >= 1) {
          miner.group.position.set(toX, 0, toZ)
          miner.group.rotation.y   = miner.targetSpot.facingAngle
          miner.state              = "mining"
          miner.miningTimer        = randFloat(4, 11)
          miner.swingPhase         = randFloat(0, Math.PI * 2)
          miner.legLGroup.rotation.x = 0
          miner.legRGroup.rotation.x = 0
          miner.armLGroup.rotation.x = 0
          miner.armRGroup.rotation.x = 0
        }
        return
      }

      // ── Mining ────────────────────────────────────────────────────────────
      miner.group.position.y = 0
      miner.swingPhase += dt * 4.0
      const sw = Math.sin(miner.swingPhase)

      // Right arm swings back then drives pickaxe forward/down
      miner.armRGroup.rotation.x = -0.15 + sw * 1.05
      // Left arm counter-swings for balance
      miner.armLGroup.rotation.x = sw * -0.25
      // Torso lean
      miner.torso.rotation.x     = -0.04 + sw * 0.04

      // Sparks on pickaxe downstroke peak
      miner.sparkTimer -= dt
      if (sw > 0.88 && miner.sparkTimer <= 0) {
        spawnSparks(miner)
        miner.sparkTimer = 0.75 + Math.random() * 0.45
      }
      if (miner.sparks) {
        const mat = miner.sparks.material as THREE.PointsMaterial
        mat.opacity -= dt * 2.8
        if (mat.opacity <= 0) { scene.remove(miner.sparks); miner.sparks = null }
      }

      // After mining timer expires, pick a new spot and walk
      miner.miningTimer -= dt
      if (miner.miningTimer <= 0) {
        if (miner.sparks) { scene.remove(miner.sparks); miner.sparks = null }
        const prev = miner.targetSpot
        miner.targetSpot  = nextSpot(miner)
        miner.state       = "walking"
        miner.walkFromX   = prev.position.x
        miner.walkFromZ   = prev.position.z
        miner.walkProgress = 0
        miner.walkPhase   = 0
        miner.walkSpeed   = randFloat(1.5, 2.5)
        miner.armRGroup.rotation.x = 0
        miner.armLGroup.rotation.x = 0
        miner.torso.rotation.x     = 0
      }
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId   = 0
    let elapsed = 0
    let lastTs  = performance.now()

    function animate(ts: number) {
      rafId    = requestAnimationFrame(animate)
      const dt = Math.min((ts - lastTs) / 1000, 0.05)
      lastTs   = ts
      elapsed += dt

      // Gem pulse
      for (const cluster of gemClusters) {
        const p = 0.9 + Math.sin(elapsed * 1.8 + cluster.phase) * 0.4
        for (const mat of cluster.mats) mat.emissiveIntensity = 2.5 * p
        cluster.light.intensity = 3.5 * p
      }

      // Torch flicker
      for (let i = 0; i < torchLights.length; i++) {
        torchLights[i].intensity =
          4.5 + Math.sin(elapsed * 8.1 + i * 2.3) * 0.8
              + Math.sin(elapsed * 17.9 + i * 3.7) * 0.4
      }
      for (let i = 0; i < flameMats.length; i++) {
        flameMats[i].emissiveIntensity = 3.5 + Math.sin(elapsed * 9.3 + i * 1.9) * 1.2
      }

      for (const miner of miners) updateMiner(miner, dt, elapsed)
      renderer.render(scene, camera)
    }
    animate(performance.now())

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const rw = el.clientWidth
      const rh = el.clientHeight
      camera.aspect = rw / rh
      camera.updateProjectionMatrix()
      renderer.setSize(rw, rh)
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const efficiency = isRunning ? 78 + (minerCount * 4) : 0

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden", background: "#1a1008" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "16%", background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "10%", background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "6%", background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "6%", background: "linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
      </div>

      {/* ── Mining Activity Card ── */}
      <div style={{
        position: "absolute", bottom: 24, right: 24, zIndex: 20,
        width: 220,
        background: "rgba(8,8,8,0.88)",
        border: `1px solid ${isRunning ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 10,
        padding: "14px 16px",
        backdropFilter: "blur(12px)",
        boxShadow: isRunning ? "0 0 24px rgba(0,255,136,0.08)" : "none",
        fontFamily: "inherit",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            background: isRunning ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${isRunning ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}>
            <span style={{ fontSize: 13 }}>⛏</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#e5e5e5", letterSpacing: "0.03em" }}>LeadMine</p>
            <p style={{ margin: 0, fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mining Engine</p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
            background: isRunning ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
            color: isRunning ? "#00FF88" : "#555",
            border: `1px solid ${isRunning ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}>
            {isRunning && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00FF88", display: "inline-block", boxShadow: "0 0 6px #00FF88" }} />
            )}
            {isRunning ? "Mining Active" : "Idle — Miners Resting"}
          </span>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Active Miners", value: isRunning ? `${minerCount}` : "0", accent: isRunning },
            { label: "Leads Found",   value: `${leadsFound}`,                   accent: leadsFound > 0 },
            { label: "Efficiency",    value: isRunning ? `${efficiency}%` : "—", accent: isRunning },
            { label: "Status",        value: isRunning ? "Scanning" : "Asleep",  accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 6, padding: "6px 8px",
            }}>
              <p style={{ margin: 0, fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: accent ? "#00FF88" : "#888" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <a href="/dashboard/leads" style={{
          display: "block", textAlign: "center",
          padding: "7px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
          color: isRunning ? "#00FF88" : "#444",
          background: isRunning ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isRunning ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.07)"}`,
          textDecoration: "none", cursor: "pointer",
          transition: "all 0.15s",
        }}>
          Open Lead Vault →
        </a>
      </div>
    </div>
  )
}
