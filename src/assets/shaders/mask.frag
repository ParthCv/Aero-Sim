#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform float uRadius;
uniform float uAspect;

in vec2 vUv;
out vec4 outColor;

void main() {
    vec2 diff = vUv - uCenter;
    diff.x *= uAspect;

    float dist = length(diff);

    float inside = step(dist, uRadius);
    outColor = vec4(vec3(inside), 1.0);
    return;
}