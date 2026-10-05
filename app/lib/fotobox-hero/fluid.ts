import {
  GLSL3, HalfFloatType, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat,
  RawShaderMaterial, Scene, Vector2, Vector3, WebGLRenderTarget,
} from 'three'
import type { IUniform, Texture, WebGLRenderer } from 'three'
import * as glsl from './glsl'

export interface FluidConfig {
  /** Aufloesung des Geschwindigkeitsfelds (kurze Kante). */
  simRes: number
  /** Aufloesung der Maske. Hoeher, weil man sie direkt sieht. */
  dyeRes: number
  /** Wie schnell die Spur verblasst, pro Sekunde. */
  dyeDissipation: number
  velocityDissipation: number
  pressure: number
  pressureIterations: number
  curl: number
}

function makeTarget(w: number, h: number) {
  return new WebGLRenderTarget(w, h, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  })
}

/** Zwei Ziele im Wechsel: aus dem einen lesen, ins andere schreiben. */
class PingPong {
  read: WebGLRenderTarget
  write: WebGLRenderTarget
  constructor(w: number, h: number) {
    this.read = makeTarget(w, h)
    this.write = makeTarget(w, h)
  }

  swap() {
    const t = this.read
    this.read = this.write
    this.write = t
  }

  setSize(w: number, h: number) {
    this.read.setSize(w, h)
    this.write.setSize(w, h)
  }

  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}

/** Kurze Kante = res, lange Kante passend zum Seitenverhaeltnis. */
function resolution(res: number, aspect: number) {
  const a = aspect < 1 ? 1 / aspect : aspect
  const min = Math.round(res)
  const max = Math.round(res * a)
  return aspect > 1 ? { w: max, h: min } : { w: min, h: max }
}

export class Fluid {
  private scene = new Scene()
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: Mesh
  private velocity: PingPong
  private dye: PingPong
  private pressure: PingPong
  private divergence: WebGLRenderTarget
  private curlTarget: WebGLRenderTarget
  private simTexel = new Vector2()
  private dyeTexel = new Vector2()
  private aspect = 1
  private m: Record<'splat' | 'advect' | 'divergence' | 'curl' | 'vorticity' | 'clear' | 'pressure' | 'gradient', RawShaderMaterial>

  constructor(private renderer: WebGLRenderer, private cfg: FluidConfig) {
    this.quad = new Mesh(new PlaneGeometry(2, 2))
    this.scene.add(this.quad)

    this.velocity = new PingPong(1, 1)
    this.dye = new PingPong(1, 1)
    this.pressure = new PingPong(1, 1)
    this.divergence = makeTarget(1, 1)
    this.curlTarget = makeTarget(1, 1)

    const mat = (fragmentShader: string, uniforms: Record<string, IUniform>) =>
      new RawShaderMaterial({
        glslVersion: GLSL3,
        vertexShader: glsl.passVert,
        fragmentShader,
        uniforms: { texelSize: { value: new Vector2() }, ...uniforms },
        depthTest: false,
        depthWrite: false,
      })

    this.m = {
      splat: mat(glsl.splatFrag, {
        uTarget: { value: null }, aspectRatio: { value: 1 },
        color: { value: new Vector3() }, point: { value: new Vector2() },
        pointA: { value: new Vector2() }, radius: { value: 0.001 }, useMax: { value: 0 },
      }),
      advect: mat(glsl.advectFrag, {
        uVelocity: { value: null }, uSource: { value: null },
        velTexel: { value: new Vector2() }, dt: { value: 0 }, dissipation: { value: 0 },
      }),
      divergence: mat(glsl.divergenceFrag, { uVelocity: { value: null } }),
      curl: mat(glsl.curlFrag, { uVelocity: { value: null } }),
      vorticity: mat(glsl.vorticityFrag, {
        uVelocity: { value: null }, uCurl: { value: null }, curl: { value: 0 }, dt: { value: 0 },
      }),
      clear: mat(glsl.clearFrag, { uTexture: { value: null }, value: { value: 0 } }),
      pressure: mat(glsl.pressureFrag, { uPressure: { value: null }, uDivergence: { value: null } }),
      gradient: mat(glsl.gradientFrag, { uPressure: { value: null }, uVelocity: { value: null } }),
    }
  }

  get dyeTexture(): Texture { return this.dye.read.texture }
  get velocityTexture(): Texture { return this.velocity.read.texture }

  resize(width: number, height: number) {
    this.aspect = width / Math.max(height, 1)
    const sim = resolution(this.cfg.simRes, this.aspect)
    const dye = resolution(this.cfg.dyeRes, this.aspect)
    this.velocity.setSize(sim.w, sim.h)
    this.pressure.setSize(sim.w, sim.h)
    this.divergence.setSize(sim.w, sim.h)
    this.curlTarget.setSize(sim.w, sim.h)
    this.dye.setSize(dye.w, dye.h)
    this.simTexel.set(1 / sim.w, 1 / sim.h)
    this.dyeTexel.set(1 / dye.w, 1 / dye.h)
  }

  /**
   * Strich von (x0, y0) nach (x1, y1), alles in 0..1 mit y nach oben.
   * dx/dy ist der Schub in Bewegungsrichtung, amount die Deckkraft der Maske.
   */
  splat(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number, amount: number, radius: number) {
    const u = this.m.splat.uniforms
    u.pointA!.value.set(x0, y0)
    u.point!.value.set(x1, y1)
    u.radius!.value = radius
    u.aspectRatio!.value = this.aspect

    u.uTarget!.value = this.velocity.read.texture
    u.color!.value.set(dx, dy, 0)
    u.useMax!.value = 0
    this.run(this.m.splat, this.velocity.write)
    this.velocity.swap()

    u.uTarget!.value = this.dye.read.texture
    u.color!.value.set(amount, amount, amount)
    u.useMax!.value = 1
    this.run(this.m.splat, this.dye.write)
    this.dye.swap()
  }

  step(dt: number) {
    const { m, cfg } = this
    const setTexel = (mat: RawShaderMaterial, t: Vector2) => { mat.uniforms.texelSize!.value.copy(t) }

    setTexel(m.curl, this.simTexel)
    m.curl.uniforms.uVelocity!.value = this.velocity.read.texture
    this.run(m.curl, this.curlTarget)

    setTexel(m.vorticity, this.simTexel)
    m.vorticity.uniforms.uVelocity!.value = this.velocity.read.texture
    m.vorticity.uniforms.uCurl!.value = this.curlTarget.texture
    m.vorticity.uniforms.curl!.value = cfg.curl
    m.vorticity.uniforms.dt!.value = dt
    this.run(m.vorticity, this.velocity.write)
    this.velocity.swap()

    setTexel(m.divergence, this.simTexel)
    m.divergence.uniforms.uVelocity!.value = this.velocity.read.texture
    this.run(m.divergence, this.divergence)

    // Alten Druck abschwaechen statt loeschen: konvergiert schneller.
    setTexel(m.clear, this.simTexel)
    m.clear.uniforms.uTexture!.value = this.pressure.read.texture
    m.clear.uniforms.value!.value = cfg.pressure
    this.run(m.clear, this.pressure.write)
    this.pressure.swap()

    setTexel(m.pressure, this.simTexel)
    m.pressure.uniforms.uDivergence!.value = this.divergence.texture
    for (let i = 0; i < cfg.pressureIterations; i++) {
      m.pressure.uniforms.uPressure!.value = this.pressure.read.texture
      this.run(m.pressure, this.pressure.write)
      this.pressure.swap()
    }

    setTexel(m.gradient, this.simTexel)
    m.gradient.uniforms.uPressure!.value = this.pressure.read.texture
    m.gradient.uniforms.uVelocity!.value = this.velocity.read.texture
    this.run(m.gradient, this.velocity.write)
    this.velocity.swap()

    // Geschwindigkeit transportiert sich selbst ...
    setTexel(m.advect, this.simTexel)
    m.advect.uniforms.velTexel!.value.copy(this.simTexel)
    m.advect.uniforms.dt!.value = dt
    m.advect.uniforms.uVelocity!.value = this.velocity.read.texture
    m.advect.uniforms.uSource!.value = this.velocity.read.texture
    m.advect.uniforms.dissipation!.value = cfg.velocityDissipation
    this.run(m.advect, this.velocity.write)
    this.velocity.swap()

    // ... und danach die Maske.
    setTexel(m.advect, this.dyeTexel)
    m.advect.uniforms.uVelocity!.value = this.velocity.read.texture
    m.advect.uniforms.uSource!.value = this.dye.read.texture
    m.advect.uniforms.dissipation!.value = cfg.dyeDissipation
    this.run(m.advect, this.dye.write)
    this.dye.swap()
  }

  private run(material: RawShaderMaterial, target: WebGLRenderTarget) {
    this.quad.material = material
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.velocity.dispose()
    this.dye.dispose()
    this.pressure.dispose()
    this.divergence.dispose()
    this.curlTarget.dispose()
    Object.values(this.m).forEach(mat => mat.dispose())
    this.quad.geometry.dispose()
  }
}
