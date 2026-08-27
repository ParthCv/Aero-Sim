import { createFloatTexture, createFrameBuffer } from "./fbo";

export class PingPongTarget {
    private gl: WebGL2RenderingContext;
    private texA: WebGLTexture;
    private texB: WebGLTexture;
    private fboA: WebGLFramebuffer;
    private fboB: WebGLFramebuffer;
    private readIsA: boolean = true;

    constructor(gl: WebGL2RenderingContext, width: number, height: number) {
        this.gl = gl;
        this.texA = createFloatTexture(gl, width, height);
        this.texB = createFloatTexture(gl, width, height);
        this.fboA = createFrameBuffer(gl, this.texA);
        this.fboB = createFrameBuffer(gl, this.texB);

        if (!this.texA || !this.texB) throw new Error('gl.createTexture() returned an error!');
        if (!this.fboA || !this.fboB) throw new Error('gl.createFrameBuffer returned error!');

        for (const fbo of [this.fboA, this.fboB]) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    get readTexture() : WebGLTexture {
        return this.readIsA ? this.texA : this.texB;
    }

    get writeFrameBuffer() : WebGLFramebuffer {
        return this.readIsA ? this.fboB : this.fboA;
    }

    swap() : void {
        this.readIsA = !this.readIsA;
    }
}