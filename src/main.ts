import './style.css';

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
resizeCanvasToDisplaySize(canvas, gl);
window.addEventListener('resize', () => resizeCanvasToDisplaySize(canvas, gl));

console.log("WebGl2 loaded succesfully");

gl.clearColor(0, 0, 0.8, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}