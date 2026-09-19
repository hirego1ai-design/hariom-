"use client";

import { useEffect, useRef } from "react";

const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`;
const fragment = `precision highp float;
uniform vec2 resolution;
uniform float rotation;
uniform vec2 parallax;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){
 vec2 p=gl_FragCoord.xy; float w=resolution.x,h=resolution.y;
 float r=max(w*.91,h*1.34); float horizon=min(h*.66,w*1.4); vec2 center=vec2(w*.5+parallax.x*12., h-horizon-r-parallax.y*5.);
 vec2 q=(p-center)/r; float d=dot(q,q); if(d>1.0){gl_FragColor=vec4(0.);return;}
 float z=sqrt(max(0.,1.-d)); vec3 n=vec3(q.x,q.y,z);
 float lon=atan(n.z,n.x)+rotation; float lat=asin(n.y);
 vec2 uv=vec2(lon*1.52,lat*3.1);
 float continental=noise(uv*1.6)*.55+noise(uv*3.7)*.28+noise(uv*8.4)*.17;
 float land=smoothstep(.46,.57,continental);
 float detail=noise(uv*34.0);
 vec3 ocean=vec3(.008,.043,.095); vec3 ground=vec3(.026,.083,.125);
 vec3 col=mix(ocean,ground,land)*(0.65+0.35*detail);
 float city=step(.67,noise(uv*67.0))*step(.52,noise(uv*23.0))*land;
 float networks=pow(max(0.,noise(uv*44.)-.68),3.)*land*2.0;
 col+=vec3(1.0,.62,.32)*(city*1.3+networks*.4)*(0.35+0.65*z);
 float rim=pow(1.0-z,15.0); col+=vec3(.05,.38,.9)*rim*.95;
 float glow=pow(1.0-z,5.0); col+=vec3(.015,.10,.24)*glow;
 float shade=.7+.3*max(0.,dot(n,normalize(vec3(-.2,.7,.7)))); col*=shade;
 gl_FragColor=vec4(col,1.0);
}`;

export default function HeroEarth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return;
    const program = gl.createProgram(); if (!program) return;
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "resolution");
    const rotation = gl.getUniformLocation(program, "rotation");
    const parallax = gl.getUniformLocation(program, "parallax");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true, frame = 0, angle = 0, last = performance.now();
    let targetX = 0, targetY = 0, x = 0, y = 0, drag = false, dragX = 0;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) last = performance.now(); }, { threshold: .01 });
    observer.observe(canvas);
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      if (drag) { angle += (event.clientX - dragX) * .0012; dragX = event.clientX; }
    };
    const onDown = (event: PointerEvent) => { if (event.pointerType !== "touch") { drag = true; dragX = event.clientX; } };
    const onUp = () => { drag = false; };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now-last)/1000, .05); last = now;
      if (!visible) return;
      if (!media.matches && !drag) angle += dt * Math.PI * 2 / 120;
      x += (targetX-x)*.035; y += (targetY-y)*.035;
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(rotation, angle + (media.matches ? 0 : x*.045));
      gl.uniform2f(parallax, media.matches ? 0 : x, media.matches ? 0 : y);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    resize(); frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointerup", onUp); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />;
}
