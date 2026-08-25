export function compileShader(gl: WebGL2RenderingContext, type: number, source: string) : WebGLShader {
    const shader : WebGLShader | null = gl.createShader(type);
    if (!shader) throw new Error('gl.createShader returned null!');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader at ${source} had a compile error: ${info}`);
    }

    return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) : WebGLProgram {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    if (!program) throw new Error('gl.createProgram returned null!');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Program had a linking error: ${info}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
}