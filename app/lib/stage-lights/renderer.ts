// Das Buehnenlicht der Startseite fuer die Seitenkoepfe: dieselben Shader-
// Funktionen, aber ohne three.js und ohne Fluid. Ein Dreieck, ein Programm,
// ein paar Uniforms. Bricht WebGL2 weg, bleibt der CSS-Verlauf darunter stehen.
import { stageLights } from './glsl'

export interface StageLightsOptions {
  /** Hintergrund und Gold als Hex, wie im Hero direkt in sRGB. */
  bg: string
  gold: string
  reducedMotion: boolean
}

export interface StageLights {
  setVisible(v: boolean): void
  pointerMove(clientX: number, clientY: number): void
  pointerLeave(): void
  destroy(): void
}

/**
 * Hoehe der Startseiten-Buehne in CSS-Pixeln. Der Kopfstreifen zeigt den
 * oberen Rand derselben Buehne, deshalb gleicher Massstab statt Streifenhoehe:
 * sonst waeren die Birnen im flachen Streifen winzig und dicht gedraengt.
 */
const STAGE_HEIGHT = 800

const vert = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const frag = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uScale;      // Buehnenhoehe in Geraetepixeln
uniform float uTime;
uniform vec2 uPointer;     // geglaettet, -1..1
uniform vec3 uBg, uGold;

${stageLights}

void main() {
  vec2 frag = gl_FragCoord.xy;
  // Oben buendig: die Oberkante des Streifens ist die Oberkante der Buehne.
  vec2 p = vec2(frag.x - 0.5 * uRes.x, frag.y - uRes.y) / uScale + vec2(0.0, 0.5);

  // Warmer Lichtkegel von oben mittig, wie der Spot hinter der Fotobox.
  vec2 c = (frag - vec2(0.5 * uRes.x, uRes.y * 1.1)) / uScale;
  float spotR = length(c * vec2(0.5, 1.0));
  vec3 bg = uBg + vec3(0.07, 0.062, 0.055) * exp(-spotR * spotR * 2.2);

  // Dieselben drei Ketten und Sterne wie im Hero, gleiche Parallaxe.
  vec3 warm = vec3(1.0, 0.74, 0.4);
  float lights = festoon(p + uPointer * 0.006, 0.42, 0.08, 0.055, 0.010, 0.55, uTime, 1.0) * 0.55
               + festoon(p + uPointer * 0.016, 0.46, 0.13, 0.085, 0.022, 0.75, uTime, 2.0) * 0.6
               + festoon(p + uPointer * 0.034, 0.54, 0.2, 0.14, 0.048, 0.92, uTime, 3.0) * 0.45;
  float stars = sparkles(p + uPointer * 0.022, uTime);
  bg += warm * lights * 0.2 + uGold * stars * 0.55;

  fragColor = vec4(bg, 1.0);
}`

function hexToRgb(hex: string): [number, number, number] {
  const v = Number.parseInt(hex.trim().replace('#', ''), 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? 'Shader-Fehler')
  }
  return sh
}

export function createStageLights(canvas: HTMLCanvasElement, opts: StageLightsOptions): StageLights {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) throw new Error('WebGL2 nicht verfuegbar')

  const prog = gl.createProgram()!
  const vs = compile(gl, gl.VERTEX_SHADER, vert)
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag)
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'Link-Fehler')
  gl.useProgram(prog)

  // Ein Dreieck, das den ganzen Bildschirm ueberdeckt: spart die Diagonale
  // eines Rechtecks aus zwei Dreiecken.
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = u('uRes'), uScale = u('uScale'), uTime = u('uTime'), uPointer = u('uPointer')
  gl.uniform3fv(u('uBg'), hexToRgb(opts.bg))
  gl.uniform3fv(u('uGold'), hexToRgb(opts.gold))

  // Weiche Lichtpunkte brauchen keine volle Retina-Aufloesung.
  const pr = Math.min(window.devicePixelRatio || 1, 1.5)
  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * pr))
    const h = Math.max(1, Math.round(canvas.clientHeight * pr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl!.viewport(0, 0, w, h)
    }
    gl!.uniform2f(uRes, w, h)
    gl!.uniform1f(uScale, STAGE_HEIGHT * pr)
  }

  const pointer = { x: 0, y: 0 }
  const target = { x: 0, y: 0 }
  let visible = true
  let frame = 0
  let prev = performance.now()
  const start = prev

  function draw(time: number) {
    gl!.uniform1f(uTime, time)
    gl!.uniform2f(uPointer, pointer.x, pointer.y)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
  }

  function loop(now: number) {
    frame = 0
    const dt = Math.max(0, now - prev) / 1000
    prev = Math.max(prev, now)
    const k = 1 - Math.exp(-dt * 3.5)
    pointer.x += (target.x - pointer.x) * k
    pointer.y += (target.y - pointer.y) * k
    draw((now - start) / 1000)
    if (visible) frame = requestAnimationFrame(loop)
  }

  const ro = new ResizeObserver(() => {
    resize()
    // Ohne Bewegung steht das Bild still, muss nach dem Groessenwechsel aber neu.
    if (opts.reducedMotion) draw(4)
  })
  ro.observe(canvas)
  resize()

  if (opts.reducedMotion) draw(4)
  else frame = requestAnimationFrame(loop)

  return {
    setVisible(v) {
      visible = v
      if (opts.reducedMotion) return
      if (v && !frame) {
        prev = performance.now()
        frame = requestAnimationFrame(loop)
      }
    },
    pointerMove(clientX, clientY) {
      const r = canvas.getBoundingClientRect()
      target.x = ((clientX - r.left) / r.width) * 2 - 1
      target.y = 1 - ((clientY - r.top) / r.height) * 2
    },
    pointerLeave() {
      target.x = 0
      target.y = 0
    },
    destroy() {
      cancelAnimationFrame(frame)
      ro.disconnect()
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}
