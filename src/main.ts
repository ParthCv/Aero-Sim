import './style.css';
import * as utils from './utils/utils';
import {createProgram} from './utils/shader_utils'

import { createFullscreenTriangle, drawFullscreenTriangle } from './rendering/fullscreen_quad'
import { PingPongTarget } from './rendering/ping_pong';

import vertSrc from './assets/shaders/passthrough.vert?raw'
import fragSrc from './assets/shaders/gradient.frag?raw'
import displayFragSrc from './assets/shaders/display.frag?raw'
import feedbackFragSrc from './assets/shaders/feedback.frag?raw'
import maskFragSrc from './assets/shaders/mask.frag?raw'
import { createFloatTexture, createFrameBuffer } from './rendering/fbo';

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

const vao = createFullscreenTriangle(gl);
const pingPong = new PingPongTarget(gl, SIM_WIDTH, SIM_HEIGHT);

const maskTexture = createFloatTexture(gl, SIM_WIDTH, SIM_HEIGHT);
const maskFrameBuffer = createFrameBuffer(gl, maskTexture);
const maskProgram = createProgram(gl, vertSrc, maskFragSrc);

const uCenterLoc = gl.getUniformLocation(maskProgram, 'uCenter');
const uRadiusLoc = gl.getUniformLocation(maskProgram, 'uRadius');
const uAspectLoc = gl.getUniformLocation(maskProgram, 'uAspect');

const feedbackProgram = createProgram(gl, vertSrc, feedbackFragSrc);
const uPrevFrameLoc = gl.getUniformLocation(feedbackProgram, 'uPrevFrame');
const uMaskLoc = gl.getUniformLocation(feedbackProgram, 'uMask');
const uFeedbackTimeLoc = gl.getUniformLocation(feedbackProgram, 'uTime');

const displayProgram = createProgram(gl, vertSrc, displayFragSrc);
const uTextureLoc = gl.getUniformLocation(displayProgram, 'uTexture');

function frame(now : number) {
  if (!startTime) {
    startTime = now;
    lastFPSsampleTime = now;
  }

  const deltaTime = (now - startTime) / 1000;
  const fpsEl = document.querySelector<HTMLElement>('#fps-readout');
  
  utils.resizeCanvasToDisplaySize(canvas, gl!);

  gl!.bindFramebuffer(gl!.FRAMEBUFFER, maskFrameBuffer);
  gl!.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);
  gl!.useProgram(maskProgram);
  gl!.uniform2f(uCenterLoc, 0.25, 0.5); // upstream-ish, vertically centered
  gl!.uniform1f(uRadiusLoc, 0.2);
  gl!.uniform1f(uAspectLoc, SIM_WIDTH / SIM_HEIGHT);
  drawFullscreenTriangle(gl!, vao);

  gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);

  gl!.bindFramebuffer(gl!.FRAMEBUFFER, pingPong.writeFrameBuffer);
  gl!.viewport(0, 0, SIM_WIDTH, SIM_HEIGHT);
  gl!.useProgram(feedbackProgram);
  gl!.activeTexture(gl!.TEXTURE0);
  gl!.bindTexture(gl!.TEXTURE_2D, pingPong.readTexture);
  gl!.uniform1i(uPrevFrameLoc, 0);
  gl!.activeTexture(gl!.TEXTURE1);
  gl!.bindTexture(gl!.TEXTURE_2D, maskTexture);
  gl!.uniform1i(uMaskLoc, 1);
  gl!.uniform1f(uFeedbackTimeLoc, deltaTime);
  drawFullscreenTriangle(gl!, vao);

  pingPong.swap();
  
  gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  
  gl!.viewport(0, 0, canvas.width, canvas.height);
  gl!.useProgram(displayProgram);
  gl!.activeTexture(gl!.TEXTURE0);
  gl!.bindTexture(gl!.TEXTURE_2D, pingPong.readTexture);
  gl!.uniform1i(uTextureLoc, 0);
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
