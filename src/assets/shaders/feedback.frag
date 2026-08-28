#version 300 es
precision highp float;

uniform sampler2D uPrevFrame;
uniform sampler2D uMask;
uniform float uTime;

in vec2 vUv;
out vec4 outColor;

void main() {
    float solid = texture(uMask, vUv).r;

    vec3 prev = texture(uPrevFrame, vUv).rgb * 0.95;
    vec2 center = vec2(0.5) + 0.35 * vec2(cos(uTime), sin(uTime));
    float dotP = smoothstep(0.03, 0.0, distance(vUv, center));

    vec3 result = prev + dotP * vec3(1.0, 0.8, 0.2);

    outColor = vec4(mix(result, vec3(0.0), solid), 1.0);
    return;
}