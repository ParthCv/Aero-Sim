export function createFullscreenTriangle(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray();
  if (!vao) throw new Error('gl.createVertexArray returned null');
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const verts = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return vao;
}

export function drawFullscreenTriangle(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject): void {
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}