import './style.css';
import * as utils from './utils/utils';
import {createProgram} from './utils/shader_utils'
import { createFullscreenTriangle, drawFullscreenTriangle } from './rendering/fullscreen_quad'
import { createFloatTexture, createFrameBuffer } from './rendering/fbo';
import { LatticeBoltzmannSim } from './sim/lattice_boltzmann_sim';

import vertSrc from './assets/shaders/passthrough.vert?raw'
import maskFragSrc from './assets/shaders/mask.frag?raw'
import velocityDisplayFragSrc from './assets/shaders/velocity_display.frag?raw'

const SIM_WIDTH = 512;
const SIM_HEIGHT = 256;

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

const floatColorBufferExt = gl.getExtension('EXT_color_buffer_float');
if (!floatColorBufferExt) {
  throw new Error(
    'EXT_color_buffer_float not supported — this GPU/browser cannot render into float framebuffers.'
  );
}

console.log("WebGl2 loaded succesfully");

// Resize canvas with the size set in CSS
window.addEventListener('resize', () => utils.resizeCanvasToDisplaySize(canvas, gl));

let frameCount = 0;
let lastFPSsampleTime = 0;
let startTime = 0;
const fpsEl = document.querySelector<HTMLElement>('#fps-readout');

const vao = createFullscreenTriangle(gl);

const maskTexture = createFloatTexture(gl, SIM_WIDTH, SIM_HEIGHT);
const maskFrameBuffer = createFrameBuffer(gl, maskTexture);
const maskProgram = createProgram(gl, vertSrc, maskFragSrc);

const uCenterLoc = gl.getUniformLocation(maskProgram, 'uCenter');
const uRadiusLoc = gl.getUniformLocation(maskProgram, 'uRadius');
const uAspectLoc = gl.getUniformLocation(maskProgram, 'uAspect');

gl.bindFramebuffer(gl!.FRAMEBUFFER, maskFrameBuffer);
gl.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);
gl.useProgram(maskProgram);
gl.uniform2f(uCenterLoc, 0.2, 0.49); // upstream-ish, vertically centered
gl.uniform1f(uRadiusLoc, 0.05);
gl.uniform1f(uAspectLoc, SIM_WIDTH / SIM_HEIGHT);
drawFullscreenTriangle(gl, vao);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const TAU = 0.55;
const INLET_DENSITY = 1.0;
const INLET_VELOCITY: [number, number] = [0.1, 0.0];
const sim = new LatticeBoltzmannSim(gl, SIM_WIDTH, SIM_HEIGHT, vao);
sim.initialize(INLET_DENSITY, [0.15, 0.0]);

const displayProgram = createProgram(gl, vertSrc, velocityDisplayFragSrc);
const uMacroLoc = gl.getUniformLocation(displayProgram, 'uMacro');
const uMaskLoc = gl.getUniformLocation(displayProgram, 'uMask');

function frame(now : number) {
  if (!startTime) {
    startTime = now;
    lastFPSsampleTime = now;
  }
  
  utils.resizeCanvasToDisplaySize(canvas, gl!);

  sim.step(maskTexture, TAU, INLET_DENSITY, INLET_VELOCITY);

  gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  gl!.viewport(0, 0, canvas.width, canvas.height);
  gl!.useProgram(displayProgram);
  gl!.activeTexture(gl!.TEXTURE0);
  gl!.bindTexture(gl!.TEXTURE_2D, sim.macroscopicTexture);
  gl!.uniform1i(uMacroLoc, 0);
  gl!.activeTexture(gl!.TEXTURE1);
  gl!.bindTexture(gl!.TEXTURE_2D, maskTexture);
  gl!.uniform1i(uMaskLoc, 1);
  drawFullscreenTriangle(gl!, vao);

  frameCount++;

  const sinceLastSample = now - lastFPSsampleTime;
  if (sinceLastSample > 500) {
    const fps = (frameCount * 1000) / sinceLastSample;
    if (fpsEl) fpsEl.textContent = `FPS:${fps.toFixed(0)}`;
    frameCount = 0;
    lastFPSsampleTime = now;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
