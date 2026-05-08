import { useEffect, useRef } from "react";

interface SmokeBackgroundProps {
  smokeColor?: string;
  className?: string;
  opacity?: number;
  variant?: "subtle" | "hero" | "section";
  speed?: number;
  scale?: number;
}

const vertexSrc = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

const fragmentSrc = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uSmoke;

// Hash / noise helpers
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x),
    u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0; i<5; i++){
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

uniform float uSpeed;
uniform float uScale;
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*iResolution.xy)/iResolution.y;
  float t = iTime * uSpeed;
  vec2 q = uv * uScale;
  q += vec2(fbm(q + t), fbm(q - t)) * 0.65;
  float n = fbm(q + t*0.5);
  vec3 base = vec3(1.0, 0.973, 0.957);
  float smoke = smoothstep(0.30, 0.88, n);
  vec3 col = mix(base, uSmoke, smoke);
  fragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3
    ? h.split("").map((c) => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return [v[0] / 255, v[1] / 255, v[2] / 255];
}

export function SmokeBackground({
  smokeColor = "#E7A8BF",
  className,
  opacity = 0.35,
}: SmokeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const pLoc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "iResolution");
    const uTime = gl.getUniformLocation(program, "iTime");
    const uSmoke = gl.getUniformLocation(program, "uSmoke");

    const rgb = hexToRgb(smokeColor);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const render = () => {
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform3f(uSmoke, rgb[0], rgb[1], rgb[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [smokeColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", opacity }}
      aria-hidden
    />
  );
}
