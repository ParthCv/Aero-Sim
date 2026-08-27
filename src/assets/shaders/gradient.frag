#version 300 es
precision highp float;

uniform float uTime;

in vec2 vUv;
out vec4 outColor;

void main() {
    float wave = sin(vUv.x * 12.0 - uTime * 1.5) * 0.5 + 0.5;
    outColor = vec4(wave, vUv.y, 1.0 - wave, 1.0);
    return;
}