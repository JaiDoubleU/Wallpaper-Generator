// WebGL2 renderer: one full-screen triangle per frame, one program per texture.
import commonSrc from './shaders/common.glsl?raw';
import weaveSrc from './shaders/weave.glsl?raw';
import marbleSrc from './shaders/marble.glsl?raw';
import { GLOBAL_PARAMS, TEXTURES, familyById, type Recipe, type TextureType } from './recipe';
import { preparePalette } from './color';

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SOURCES: Record<TextureType, string> = { weave: weaveSrc, marble: marbleSrc };

export interface PaletteData { pal: Float32Array; stops: Float32Array }

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private programs = new Map<TextureType, WebGLProgram>();
  private locs = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

  constructor(canvas: HTMLCanvasElement, opts: { preserve?: boolean } = {}) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: !!opts.preserve,
    });
    if (!gl) throw new Error('webgl2-unavailable');
    this.gl = gl;
  }

  private program(type: TextureType): WebGLProgram {
    const cached = this.programs.get(type);
    if (cached) return cached;
    const gl = this.gl;
    const compile = (kind: number, src: string) => {
      const sh = gl.createShader(kind)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader error');
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `${commonSrc}\n${SOURCES[type]}`));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
    this.programs.set(type, prog);
    this.locs.set(prog, new Map());
    return prog;
  }

  private loc(prog: WebGLProgram, name: string) {
    const m = this.locs.get(prog)!;
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(prog, name));
    return m.get(name)!;
  }

  /** Renders the recipe at w × h pixels. An optional palette override is used for the app background. */
  render(recipe: Recipe, w: number, h: number, paletteOverride?: PaletteData) {
    const gl = this.gl;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    const prog = this.program(recipe.texture.type);
    gl.useProgram(prog);
    gl.viewport(0, 0, w, h);

    gl.uniform2f(this.loc(prog, 'uRes'), w, h);
    gl.uniform1ui(this.loc(prog, 'uSeed'), recipe.seed >>> 0);

    const fam = familyById(recipe.palette.family);
    const { pal, stops } = paletteOverride ?? preparePalette(fam[recipe.palette.variant]);
    gl.uniform3fv(this.loc(prog, 'uPal'), pal);
    gl.uniform1fv(this.loc(prog, 'uStops'), stops);

    for (const p of GLOBAL_PARAMS) {
      const v = recipe.global[p.key] ?? 0;
      gl.uniform1f(this.loc(prog, p.uniform), p.toUniform ? p.toUniform(v) : v);
    }
    for (const p of TEXTURES[recipe.texture.type].params) {
      const v = recipe.texture.params[p.key];
      gl.uniform1f(this.loc(prog, p.uniform), p.toUniform ? p.toUniform(v) : v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Mean and spread of luminance in the lock-screen clock band (8–30 % from
   * the top), read straight after a render. Drives the clock colour and the
   * readability warning (Requirements §6, FR-11).
   */
  clockBandStats(): { mean: number; spread: number } {
    const gl = this.gl;
    const w = this.canvas.width, h = this.canvas.height;
    const y0 = Math.floor(h * 0.70), bh = Math.max(1, Math.floor(h * 0.22));
    const px = new Uint8Array(w * bh * 4);
    gl.readPixels(0, y0, w, bh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sum = 0, sum2 = 0, n = 0;
    for (let i = 0; i < px.length; i += 16) {
      const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
      sum += l; sum2 += l * l; n++;
    }
    const mean = sum / n;
    return { mean, spread: Math.sqrt(Math.max(0, sum2 / n - mean * mean)) };
  }
}
