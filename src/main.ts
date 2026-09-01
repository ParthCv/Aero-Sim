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
let currentVelMagnitude = 0;
let lastFrameTime = 0;
const fpsEl = document.querySelector<HTMLElement>('#fps-readout');

const vao = createFullscreenTriangle(gl);

const maskTexture = createFloatTexture(gl, SIM_WIDTH, SIM_HEIGHT);
addMask(gl, maskTexture);

const displayProgram = createProgram(gl, vertSrc, velocityDisplayFragSrc);
const uMacroLoc = gl.getUniformLocation(displayProgram, 'uMacro');
const uMaskLoc = gl.getUniformLocation(displayProgram, 'uMask');

const TAU = 0.8;
const INLET_DENSITY = 1.0;
const INLET_ACCEL = 0.03;
const INITIAL_INLET_VELOCITY: [number, number] = [0.0, 0.0];
const TARGET_INLET_VELOCITY: [number, number] = [0.2, 0.0];

const sim = new LatticeBoltzmannSim(gl, SIM_WIDTH, SIM_HEIGHT, vao);
sim.initialize(INLET_DENSITY, INITIAL_INLET_VELOCITY);

function frame(now : number) {
  if (!startTime) {
    startTime = now;
    lastFPSsampleTime = now;
  }

  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  const targetMagnitude = Math.hypot(TARGET_INLET_VELOCITY[0], TARGET_INLET_VELOCITY[1]);
  currentVelMagnitude = Math.min(currentVelMagnitude + INLET_ACCEL * dt, targetMagnitude);
  const scale = targetMagnitude > 0 ? currentVelMagnitude / targetMagnitude : 0;
  const currentInletVelocity: [number, number] = [
    TARGET_INLET_VELOCITY[0] * scale,
    TARGET_INLET_VELOCITY[1] * scale,
  ];

  utils.resizeCanvasToDisplaySize(canvas, gl!);

  sim.step(maskTexture, TAU, INLET_DENSITY, currentInletVelocity);

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

// Temp function for mask creation
function addMask(gl: WebGL2RenderingContext, texture: WebGLTexture): void {
  const maskFrameBuffer = createFrameBuffer(gl, texture);
  const maskProgram = createProgram(gl, vertSrc, maskFragSrc);

  const uCenterLoc = gl.getUniformLocation(maskProgram, 'uCenter');
  const uRadiusLoc = gl.getUniformLocation(maskProgram, 'uRadius');
  const uAspectLoc = gl.getUniformLocation(maskProgram, 'uAspect');

  gl.bindFramebuffer(gl!.FRAMEBUFFER, maskFrameBuffer);
  gl.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);
  gl.useProgram(maskProgram);
  gl.uniform2f(uCenterLoc, 0.2, 0.5); 
  gl.uniform1f(uRadiusLoc, 0.05);
  gl.uniform1f(uAspectLoc, SIM_WIDTH / SIM_HEIGHT);
  drawFullscreenTriangle(gl, vao);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}