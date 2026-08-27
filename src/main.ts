import './style.css';
import * as utils from './utils/utils';
import {createProgram} from './utils/shader_utils'
import { createFullscreenTriangle, drawFullscreenTriangle } from './fullscreen_quad'
import vertSrc from './assets/shaders/passthrough.vert?raw'
import fragSrc from './assets/shaders/gradient.frag?raw'

const canvas = document.querySelector<HTMLCanvasElement>('#sim-canvas')!;
const gl = canvas.getContext('webgl2', { 
  alpha: false,
  depth: false,
  antialias: false,
  stencil: false,
  powerPreference: 'high-performance',
 });
if (!gl) {
  throw new Error('WebGL2 not supported');
}

// Resize canvas with the size set in CSS
utils.resizeCanvasToDisplaySize(canvas, gl);
window.addEventListener('resize', () => utils.resizeCanvasToDisplaySize(canvas, gl));

console.log("WebGl2 loaded succesfully");

const program = createProgram(gl, vertSrc, fragSrc);
const vao = createFullscreenTriangle(gl);
const uTimeLoc = gl.getUniformLocation(program, 'uTime');

let frameCount = 0;
let lastFPSsampleTime = 0;
let startTime = 0;

function frame(now : number) {
  if (!startTime) {
    startTime = now;
    lastFPSsampleTime = now;
  }

  const deltaTime = (now - startTime) / 1000;
  const fpsEl = document.querySelector<HTMLElement>('#fps-readout');
  
  utils.resizeCanvasToDisplaySize(canvas, gl!);

  gl!.useProgram(program);
  gl!.uniform1f(uTimeLoc, deltaTime);
  drawFullscreenTriangle(gl!, vao);

  frameCount++;

  const sinceLastSample = now - lastFPSsampleTime;
  if (sinceLastSample > 500) {
    const fps = (frameCount * 1000) / sinceLastSample;
    if (fpsEl) fpsEl.textContent = ` FPS:${fps.toFixed(0)}`;
    frameCount = 0;
    lastFPSsampleTime = now;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
