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

gl.useProgram(program);
drawFullscreenTriangle(gl, vao);

