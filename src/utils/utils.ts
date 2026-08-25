export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}