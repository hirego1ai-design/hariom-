"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HomeHero.module.css";

const vertexSource = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentSource = `
precision highp float;
uniform vec2 viewport;
uniform float pixelRatio;
uniform float horizon;
uniform float radius;
uniform float rotation;
uniform vec2 parallax;
uniform sampler2D earthMap;

void main() {
  vec2 pixel = gl_FragCoord.xy / pixelRatio;
  pixel.y = viewport.y - pixel.y;
  vec2 sun = vec2(viewport.x * .5 + parallax.x * 4.0, horizon + parallax.y * 2.0);
  vec2 center = sun + vec2(0.0, radius);
  vec2 offset = pixel - center;
  float distanceToEdge = length(offset) - radius;
  // Coverage is measured in CSS pixels so the silhouette remains smooth at every DPR.
  float coverage = 1.0 - smoothstep(-.85, .85, distanceToEdge);
  float outside = max(distanceToEdge, 0.0);
  float halo = exp(-outside / 12.0) * .5 + exp(-outside / 32.0) * .075;
  float alpha = coverage + (1.0 - coverage) * halo;
  vec3 color = vec3(.025, .31, .78) * (1.0 - coverage) * halo;

  if (coverage > 0.0) {
    vec2 q = offset / radius;
    q /= max(1.0, length(q));
    vec3 normal = vec3(q.x, -q.y, sqrt(max(0.0, 1.0 - dot(q, q))));
    // Tilt the surface toward populated mid-latitudes; the horizon never collapses into a pole.
    float tilt = .82;
    vec3 mapped = vec3(normal.x,
      normal.y * cos(tilt) - normal.z * sin(tilt),
      normal.y * sin(tilt) + normal.z * cos(tilt));
    vec2 uv = vec2(.5 + (atan(mapped.x, mapped.z) + rotation) / 6.2831853,
                   .5 + asin(clamp(mapped.y, -1.0, 1.0)) / 3.14159265);
    vec3 surface = texture2D(earthMap, uv).rgb;
    float inward = max(-distanceToEdge, 0.0);
    float daylight = exp(-inward / 125.0);
    float centerLight = exp(-pow((pixel.x - sun.x) / (viewport.x * .32), 2.0));
    float cityLight = max(0.0, surface.r - .16);
    surface *= .74 + daylight * .4;
    surface += vec3(.3, .13, .025) * cityLight;
    surface += vec3(.009, .046, .095) * daylight;
    surface += vec3(.025, .082, .16) * daylight * centerLight;
    surface += vec3(.16, .55, 1.0) * exp(-inward / 4.5);
    surface += vec3(.32, .64, .85) * exp(-abs(distanceToEdge) / 1.35);
    color += surface * coverage;
  }

  // The sunrise, atmospheric halo and surface use exactly the same horizon coordinates.
  vec2 s = pixel - sun;
  float broadLight = exp(-pow(s.x / 125.0, 2.0) - pow(s.y / 25.0, 2.0)) * .22;
  float warmLight = exp(-pow(s.x / 33.0, 2.0) - pow(s.y / 13.0, 2.0)) * .72;
  float sunCore = exp(-pow(s.x / 9.0, 2.0) - pow(s.y / 4.4, 2.0));
  float streak = exp(-pow(s.x / 100.0, 2.0) - pow(s.y / 1.1, 2.0)) * .25;
  float lightAlpha = clamp(broadLight + warmLight + sunCore + streak, 0.0, 1.0);
  vec3 lightColor = vec3(.2, .52, 1.0) * broadLight
                 + vec3(1.0, .73, .43) * warmLight
                 + vec3(1.0, .97, .87) * (sunCore + streak);
  color = color * (1.0 - lightAlpha * .55) + lightColor;
  alpha = max(alpha, lightAlpha);
  gl_FragColor = vec4(color / max(alpha, .0001), alpha);
}
`;

export default function HeroEarth() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }
    const program = gl.createProgram();
    if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return; }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!buffer || !texture) {
      gl.deleteBuffer(buffer); gl.deleteTexture(texture);
      gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      viewport: gl.getUniformLocation(program, "viewport"),
      pixelRatio: gl.getUniformLocation(program, "pixelRatio"),
      horizon: gl.getUniformLocation(program, "horizon"),
      radius: gl.getUniformLocation(program, "radius"),
      rotation: gl.getUniformLocation(program, "rotation"),
      parallax: gl.getUniformLocation(program, "parallax"),
    };
    gl.uniform1i(gl.getUniformLocation(program, "earthMap"), 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let loaded = false, visible = true, disposed = false, shown = false;
    let frame = 0, lastTime = 0, angle = -.3;
    let width = 1, height = 1, ratio = 1, earthTop = 1, earthRadius = 1;
    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    let dragging = false, lastDragX = 0, dragTarget = 0, dragOffset = 0;

    const draw = () => {
      if (!loaded || disposed || gl.isContextLost()) return;
      gl.uniform2f(uniforms.viewport, width, height);
      gl.uniform1f(uniforms.pixelRatio, ratio);
      gl.uniform1f(uniforms.horizon, earthTop);
      gl.uniform1f(uniforms.radius, earthRadius);
      gl.uniform1f(uniforms.rotation, angle + dragOffset + (reducedMotion.matches ? 0 : pointerX * .025));
      gl.uniform2f(uniforms.parallax, reducedMotion.matches ? 0 : pointerX, reducedMotion.matches ? 0 : pointerY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!shown) { shown = true; setReady(true); }
    };
    const tick = (time: number) => {
      frame = 0;
      if (disposed || !loaded || !visible || document.hidden || gl.isContextLost()) return;
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
      lastTime = time;
      if (!reducedMotion.matches) {
        if (!dragging) angle += delta * Math.PI * 2 / 120;
        const damping = 1 - Math.exp(-delta * 5);
        pointerX += (targetX - pointerX) * damping;
        pointerY += (targetY - pointerY) * damping;
        dragOffset += (dragTarget - dragOffset) * damping;
      }
      draw();
      if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (!disposed && loaded && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.25 : 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const copy = scene.closest("section")?.querySelector("[data-hero-copy]");
      const copyBottom = copy ? copy.getBoundingClientRect().bottom - bounds.top : height * .53;
      earthTop = Math.max(height * (width < 700 ? .59 : .53), copyBottom + (width < 700 ? 45 : 30));
      earthRadius = Math.max(width * 1.42, height * .95);
      scene.style.setProperty("--earth-top", `${earthTop}px`);
      scene.style.setProperty("--earth-radius", `${earthRadius}px`);
      draw();
    };

    const map = new window.Image();
    map.onload = () => {
      if (disposed || gl.isContextLost()) return;
      // A power-of-two mipmapped texture keeps the grazing-angle detail stable and the wrap continuous.
      const source = document.createElement("canvas");
      source.width = Math.min(width < 700 ? 2048 : 4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
      source.height = source.width / 2;
      const context = source.getContext("2d");
      if (!context) return;
      context.drawImage(map, 0, 0, source.width, source.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
      if (anisotropy) gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(4, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      loaded = true;
      resize(); resume();
    };
    map.src = "/marketing/images/earth-night-nasa.jpg";

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = scene.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / width * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / height * 2 - 1));
      if (dragging) {
        dragTarget += Math.max(-30, Math.min(30, event.clientX - lastDragX)) * .001;
        lastDragX = event.clientX;
      }
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches || event.clientY - scene.getBoundingClientRect().top < earthTop) return;
      dragging = true; lastDragX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onUp = () => { dragging = false; canvas.style.cursor = ""; };
    const onLeave = () => { targetX = 0; targetY = 0; };
    const onContextLost = (event: Event) => {
      event.preventDefault(); cancelAnimationFrame(frame); frame = 0; setReady(false);
    };
    const onContextRestored = () => setContextVersion(value => value + 1);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }, { threshold: .01 });
    intersection.observe(scene);
    const observer = new ResizeObserver(resize);
    observer.observe(scene);
    const copy = scene.closest("section")?.querySelector("[data-hero-copy]");
    if (copy) observer.observe(copy);
    resize();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    scene.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    document.addEventListener("visibilitychange", resume);
    reducedMotion.addEventListener("change", resume);

    return () => {
      disposed = true; cancelAnimationFrame(frame); map.onload = null;
      intersection.disconnect(); observer.disconnect();
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
      scene.removeEventListener("pointerleave", onLeave); canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointercancel", onUp); canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", resume); reducedMotion.removeEventListener("change", resume);
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
    };
  }, [contextVersion]);

  return <div ref={sceneRef} className={styles.scene} aria-hidden="true">
    {!ready && <div className={styles.fallback} />}
    <canvas ref={canvasRef} className={styles.canvas} />
  </div>;
}
