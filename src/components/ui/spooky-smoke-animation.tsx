import React, { useEffect, useRef } from "react";

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

// Sharper, more defined pink + white smoke. Light pink, no blur.
const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time*1.0+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<7;i++){t+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.55;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;

  float n1 = fbm(uv*2.0 + vec2(T*0.10, T*0.06));
  float n2 = fbm(uv*3.2 - vec2(T*0.14, -T*0.09) + n1*1.2);
  float n  = fbm(uv*1.6 + vec2(n2*1.2, -n2*0.9) + T*0.05);

  // Tighter smoothstep = sharper, more defined wisps (less blur)
  float density = smoothstep(0.30, 0.70, n*0.7 + n2*0.6);

  vec3 base = vec3(1.0, 0.97, 0.985);
  vec3 col = mix(base, u_color, density);

  col = mix(base, col, min(time*0.4, 1.0));
  O = vec4(col, 1.0);
}`;

class Renderer {
  private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private color: [number, number, number] = [0.96, 0.72, 0.78];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    this.setup();
    this.init();
  }

  updateColor(c: [number, number, number]) {
    this.color = c;
  }

  updateScale() {
    const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio));
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
  }

  reset() {
    const { gl, program, vs, fs } = this;
    if (!program) return;
    if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs); }
    if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs); }
    gl.deleteProgram(program);
    this.program = null;
  }

  private setup() {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!this.vs || !this.fs || !program) return;
    this.compile(this.vs, vertexShaderSource);
    this.compile(this.fs, fragmentShaderSource);
    this.program = program;
    gl.attachShader(program, this.vs);
    gl.attachShader(program, this.fs);
    gl.linkProgram(program);
  }

  private init() {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this;
    if (!program || !gl.isProgram(program)) return;
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(gl.getUniformLocation(program, "resolution"), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, "time"), now * 1e-3);
    gl.uniform3fv(gl.getUniformLocation(program, "u_color"), this.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

const hexToRgb = (hex: string): [number, number, number] | null => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255] : null;
};

interface SmokeBackgroundProps {
  smokeColor?: string;
  className?: string;
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({
  smokeColor = "#F5B7C0",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas.getContext("webgl2")) return;
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;

    const handleResize = () => renderer.updateScale();
    handleResize();
    window.addEventListener("resize", handleResize);

    let raf = 0;
    const loop = (now: number) => {
      renderer.render(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
      renderer.reset();
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const rgb = hexToRgb(smokeColor);
    if (rgb) renderer.updateColor(rgb);
  }, [smokeColor]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} />;
};
