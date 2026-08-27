#version 300 es
precision highp float;

uniform sampler2D uPrevFrame;
uniform float uTime;

in vec2 vUv;
out vec4 outColor;

void main() {
    vec3 prev = texture(uPrevFrame, vUv).rgb * 0.95;
    vec2 center = vec2(0.5) + 0.35 * vec2(cos(uTime), sin(uTime));
    float dotP = smoothstep(0.03, 0.0, distance(vUv, center));

    outColor = vec4(prev + dotP * vec3(1.0, 0.0, 0.2), 1.0);
    return;
}