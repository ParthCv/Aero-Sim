#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

void main() {
    outColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
    return;
}