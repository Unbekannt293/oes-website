import {
  GLSL3, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RawShaderMaterial,
  Scene, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three'
import { Fluid } from './fluid'
import { compositeFrag, compositeVert } from './glsl'

export interface FotoboxHeroOptions {
  image: string
  maps: string
  /** Blitzquelle relativ im Bild, y von oben gezaehlt wie in Bildprogrammen. */
  flashAt: [number, number]
  reducedMotion: boolean
  /** Farben aus den Design-Tokens. */
  colors: { paper: string, line: string, gold: string }
}

export interface FotoboxHero {
  pointerMove: (clientX: number, clientY: number) => void
  pointerLeave: () => void
  flash: () => void
  setVisible: (visible: boolean) => void
  destroy: () => void
}

/** Pro Pointer-Ereignis hoechstens so viele Zwischen-Splats bei schnellen Bewegungen. */
const MAX_SUBSTEPS = 12
const IDLE_AFTER_MS = 2500
const FLASH_COOLDOWN_MS = 900

// Bewusst kein THREE.Color: der rechnet Hex-Werte in linearen Farbraum um.
// Der Shader arbeitet aber wie die Texturen direkt in sRGB.
function hexToVec3(hex: string) {
  const v = Number.parseInt(hex.trim().replace('#', ''), 16)
  return new Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255)
}

export async function createFotoboxHero(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  opts: FotoboxHeroOptions,
): Promise<FotoboxHero> {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  // Die Fluid-Simulation rechnet in Halbfloat-Texturen. Ohne diese
  // Erweiterung gibt es nichts zu zeigen, dann bleibt das statische Bild.
  if (!renderer.extensions.has('EXT_color_buffer_float') && !renderer.extensions.has('EXT_color_buffer_half_float')) {
    renderer.dispose()
    throw new Error('Halbfloat-Rendering nicht unterstuetzt')
  }

  const loader = new TextureLoader()
  const [baseTex, mapsTex] = await Promise.all([loader.loadAsync(opts.image), loader.loadAsync(opts.maps)])
  for (const t of [baseTex, mapsTex]) {
    t.minFilter = LinearFilter
    t.generateMipmaps = false
  }
  const imgAspect = baseTex.image.width / baseTex.image.height

  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const fluid = new Fluid(renderer, {
    simRes: small ? 64 : 128,
    dyeRes: small ? 384 : 768,
    dyeDissipation: 1.35,
    velocityDissipation: 1.8,
    pressure: 0.8,
    pressureIterations: small ? 12 : 20,
    curl: 12,
  })

  const material = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: compositeVert,
    fragmentShader: compositeFrag,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tBase: { value: baseTex },
      tMaps: { value: mapsTex },
      tDye: { value: null },
      tVel: { value: null },
      uRes: { value: new Vector2() },
      uImgRect: { value: new Vector4() },
      uPointer: { value: new Vector2() },
      uFlashAt: { value: new Vector2(opts.flashAt[0], 1 - opts.flashAt[1]) },
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uFlashWhite: { value: 0 },
      uPaper: { value: hexToVec3(opts.colors.paper) },
      uLine: { value: hexToVec3(opts.colors.line) },
      uGold: { value: hexToVec3(opts.colors.gold) },
    },
  })
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new Mesh(new PlaneGeometry(2, 2), material)
  scene.add(quad)
  const u = material.uniforms

  // ---------- Layout: dieselben CSS-Variablen wie das Fallback-Bild ----------
  let cssW = 1
  let cssH = 1
  function layout() {
    const rect = root.getBoundingClientRect()
    cssW = Math.max(rect.width, 1)
    cssH = Math.max(rect.height, 1)
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(pr)
    renderer.setSize(cssW, cssH, false)
    fluid.resize(cssW, cssH)

    const style = getComputedStyle(root)
    const fx = Number.parseFloat(style.getPropertyValue('--fb-x')) || 0.5
    const fh = Number.parseFloat(style.getPropertyValue('--fb-h')) || 0.95
    const h = cssH * fh * pr
    const w = h * imgAspect
    u.uRes!.value.set(cssW * pr, cssH * pr)
    // Unterkante buendig: das Stativ laeuft aus dem Bild heraus.
    u.uImgRect!.value.set(cssW * fx * pr - w / 2, 0, w, h)
  }

  // ---------- Eingabe ----------
  const target = new Vector2()      // wohin der Parallax-Blick will
  let last: { x: number, y: number } | null = null
  let lastInput = -Infinity
  let lastFlash = -Infinity
  let flashStart = -Infinity

  function splatTrail(x: number, y: number, amount: number) {
    if (!last) {
      last = { x, y }
      return
    }
    const dx = x - last.x
    const dy = y - last.y
    const dist = Math.hypot(dx * (cssW / cssH), dy)
    const steps = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dist / 0.012)))
    const radius = cssW < 700 ? 0.0022 : 0.0013
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      fluid.splat(last.x + dx * t, last.y + dy * t, dx * 3000 / steps, dy * 3000 / steps, amount / Math.sqrt(steps), radius)
    }
    last = { x, y }
  }

  function pointerMove(clientX: number, clientY: number) {
    const rect = root.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = 1 - (clientY - rect.top) / rect.height
    target.set(x * 2 - 1, y * 2 - 1)
    lastInput = performance.now()
    splatTrail(x, y, 0.9)
  }

  function pointerLeave() {
    last = null
    target.set(0, 0)
  }

  function flash() {
    const now = performance.now()
    // WCAG 2.3.1: hoechstens drei Blitze pro Sekunde.
    if (now - lastFlash < FLASH_COOLDOWN_MS) return
    lastFlash = now
    flashStart = now
  }

  // ---------- Schleife ----------
  let raf = 0
  let visible = true
  let prev = performance.now()
  let time = 0
  const pointer = new Vector2()

  function frame(now: number) {
    // Nach unten klemmen: Der Zeitstempel von requestAnimationFrame kann frueher
    // liegen als das performance.now() aus setVisible. Ein negatives dt dreht
    // die Daempfung der Fluid-Simulation um, und alles explodiert.
    const dt = Math.min(Math.max((now - prev) / 1000, 0), 1 / 30)
    prev = Math.max(prev, now)
    if (!opts.reducedMotion) time += dt

    // Leerlauf: der Blick wandert langsam, eine leise Spur zieht mit.
    // Ohne das wirkt der Hero auf dem Handy tot, dort gibt es keinen Hover.
    const idle = now - lastInput > IDLE_AFTER_MS
    if (idle && !opts.reducedMotion) {
      const t = time * 0.35
      const ix = 0.5 + Math.sin(t) * 0.28 + Math.sin(t * 2.3) * 0.06
      const iy = 0.55 + Math.sin(t * 1.4 + 1.0) * 0.22
      target.set(ix * 2 - 1, iy * 2 - 1)
      splatTrail(ix, iy, 0.28)
    }
    else if (idle) {
      last = null
    }

    // Weich nachziehen, unabhaengig von der Bildrate.
    pointer.lerp(target, 1 - Math.exp(-dt * 3.5))
    u.uPointer!.value.copy(pointer)

    const since = (now - flashStart) / 1000
    const env = since < 0.05 ? since / 0.05 : Math.exp(-(since - 0.05) * 2.4)
    u.uFlash!.value = since >= 0 && since < 3 ? env : 0
    u.uFlashWhite!.value = !opts.reducedMotion && since >= 0 && since < 1 ? Math.exp(-since * 14) * 0.85 : 0

    if (dt > 0) fluid.step(dt)

    u.tDye!.value = fluid.dyeTexture
    u.tVel!.value = fluid.velocityTexture
    u.uTime!.value = time
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)

    raf = visible ? requestAnimationFrame(frame) : 0
  }

  function setVisible(v: boolean) {
    visible = v
    if (v && !raf) {
      prev = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  const ro = new ResizeObserver(layout)
  ro.observe(root)
  layout()
  raf = requestAnimationFrame(frame)

  // Nur in der Entwicklung: einzelne Frames von aussen ausloesen, z. B. wenn
  // der Tab unsichtbar ist und der Browser requestAnimationFrame anhaelt.
  if (import.meta.dev) {
    // Eigene Uhr: im unsichtbaren Tab steht die echte Frame-Zeit still.
    let vt = performance.now()
    Object.assign(window, {
      __fotoboxHero: {
        renderFrame: (ms = 16.7) => {
          vt = Math.max(vt, prev) + ms
          frame(vt)
        },
        pointerMove: (x: number, y: number) => {
          pointerMove(x, y)
          lastInput = vt
        },
        flash: () => {
          lastFlash = -Infinity
          flashStart = vt
        },
        pixel: (x: number, y: number) => {
          const gl = renderer.getContext()
          const out = new Uint8Array(4)
          gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out)
          return Array.from(out)
        },
      },
    })
  }

  function destroy() {
    cancelAnimationFrame(raf)
    ro.disconnect()
    fluid.dispose()
    material.dispose()
    quad.geometry.dispose()
    baseTex.dispose()
    mapsTex.dispose()
    renderer.dispose()
    // GPU-Kontext sofort freigeben, Browser erlauben nur wenige gleichzeitig.
    renderer.forceContextLoss()
  }

  return { pointerMove, pointerLeave, flash, setVisible, destroy }
}
