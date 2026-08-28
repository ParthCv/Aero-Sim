import { PingPongTarget } from "../rendering/ping_pong";
import { createFloatTexture, createFrameBuffer } from "../rendering/fbo";
import { drawFullscreenTriangle } from "../rendering/fullscreen_quad";
import { createProgram } from "../utils/shader_utils";

import vertSrc from '../assets/shaders/passthrough.vert?raw'
import equilibriumFragShader from '../assets/shaders/equilibrium.frag?raw'
import collisionFragShader from "../assets/shaders/collision.frag?raw"
import macroscopicFragShader from '../assets/shaders/macroscopic.frag?raw'

export class LatticeBoltzmannSim {
    private gl: WebGL2RenderingContext;
    private width: number;
    private height: number;
    private vao: WebGLVertexArrayObject;

    private group0: PingPongTarget;
    private group1: PingPongTarget;
    private group2: PingPongTarget;

    private equilibriumProgram: WebGLProgram;
    private uEqDensityLoc: WebGLUniformLocation | null;
    private uEqVelocityLoc: WebGLUniformLocation | null;
    private uEqGroupLoc: WebGLUniformLocation | null;

    private collisionProgram: WebGLProgram;
    private uColF0to3Loc: WebGLUniformLocation | null;
    private uColF4to7Loc: WebGLUniformLocation | null;
    private uColF8Loc: WebGLUniformLocation | null;
    private uColTauLoc: WebGLUniformLocation | null;
    private uColGroupLoc: WebGLUniformLocation | null;
    
    private macroscopicProgram: WebGLProgram;
    private macroTexture: WebGLTexture;
    private macroFrameBuffer: WebGLFramebuffer;
    private uMacroF0to3Loc: WebGLUniformLocation | null;
    private uMacroF4to7Loc: WebGLUniformLocation | null;
    private uMacroF8Loc: WebGLUniformLocation | null;

    constructor(gl: WebGL2RenderingContext, width: number, height: number, vao: WebGLVertexArrayObject) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.vao = vao;

        this.group0 = new PingPongTarget(gl, width, height);
        this.group1 = new PingPongTarget(gl, width, height);
        this.group2 = new PingPongTarget(gl, width, height);

        this.equilibriumProgram = createProgram(gl, vertSrc, equilibriumFragShader);
        this.uEqDensityLoc = gl.getUniformLocation(this.equilibriumProgram, 'uDensity');
        this.uEqVelocityLoc = gl.getUniformLocation(this.equilibriumProgram, 'uVelocity');
        this.uEqGroupLoc = gl.getUniformLocation(this.equilibriumProgram, 'uGroup');

        this.collisionProgram = createProgram(gl, vertSrc, collisionFragShader);
        this.uColF0to3Loc = gl.getUniformLocation(this.collisionProgram, 'uF0to3');
        this.uColF4to7Loc = gl.getUniformLocation(this.collisionProgram, 'uF4to7');
        this.uColF8Loc = gl.getUniformLocation(this.collisionProgram, 'uF8');
        this.uColGroupLoc = gl.getUniformLocation(this.collisionProgram, 'uGroup');
        this.uColTauLoc = gl.getUniformLocation(this.collisionProgram, 'uTau');

        this.macroscopicProgram = createProgram(gl, vertSrc, macroscopicFragShader);
        this.macroTexture = createFloatTexture(gl, width, height);
        this.macroFrameBuffer = createFrameBuffer(gl, this.macroTexture);
        this.uMacroF0to3Loc = gl.getUniformLocation(this.macroscopicProgram, 'uF0to3');
        this.uMacroF4to7Loc = gl.getUniformLocation(this.macroscopicProgram, 'uF4to7');
        this.uMacroF8Loc = gl.getUniformLocation(this.macroscopicProgram, 'uF8');
    }

    get macroscopicTexture(): WebGLTexture {
        return this.macroTexture;
    }

    initialize(density: number, velocity: [number, number]): void {
        const { gl } = this;

        gl.useProgram(this.equilibriumProgram);
        gl.viewport(0, 0, this.width, this.height);
        gl.uniform1f(this.uEqDensityLoc, density);
        gl.uniform2f(this.uEqVelocityLoc, velocity[0], velocity[1]);

        const groups: [PingPongTarget, number][] = [
            [this.group0, 0],
            [this.group1, 1],
            [this.group2, 2]
        ];

        for (const [target, groupIndex] of groups) {
            gl.uniform1i(this.uEqGroupLoc, groupIndex);

            for (let i = 0; i < 2; i++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.writeFrameBuffer);
                drawFullscreenTriangle(gl, this.vao);
                target.swap();
            }
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    collide(tau: number): void {
        const { gl } = this;

        gl.useProgram(this.collisionProgram);
        gl.viewport(0, 0, this.width, this.height);
        gl.uniform1f(this.uColTauLoc, tau);

        const groups: [PingPongTarget, number][] = [
            [this.group0, 0],
            [this.group1, 1],
            [this.group2, 2]
        ];

        for (const [target, groupIndex] of groups) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.writeFrameBuffer);
            gl.uniform1i(this.uColGroupLoc, groupIndex);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.group0.readTexture);
            gl.uniform1i(this.uColF0to3Loc, 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.group1.readTexture);
            gl.uniform1i(this.uColF4to7Loc, 1);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.group2.readTexture);
            gl.uniform1i(this.uColF8Loc, 2);

            drawFullscreenTriangle(gl, this.vao);
        }
    }
    
    computeMacrosopic(): void {
        const { gl } = this;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.macroFrameBuffer);
        gl.viewport(0, 0, this.width, this.height);
        gl.useProgram(this.macroscopicProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.group0.readTexture);
        gl.uniform1i(this.uMacroF0to3Loc, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.group1.readTexture);
        gl.uniform1i(this.uMacroF4to7Loc, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.group2.readTexture);
        gl.uniform1i(this.uMacroF8Loc, 2);

        drawFullscreenTriangle(gl, this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}