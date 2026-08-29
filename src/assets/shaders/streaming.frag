#version 300 es
precision highp float;

uniform sampler2D uSelf;
uniform vec2 uTexelSize;
uniform int uGroup;

in vec2 vUv;
out vec4 outColor;

void main() {
    if (uGroup == 0) {
        float f0 = texture(uSelf, vUv).x;
        float f1 = texture(uSelf, vUv - vec2(1.0, 0.0) * uTexelSize).y;
        float f2 = texture(uSelf, vUv - vec2(0.0, 1.0) * uTexelSize).z;
        float f3 = texture(uSelf, vUv - vec2(-1.0, 0.0) * uTexelSize).w;
        outColor = vec4(f0, f1, f2, f3);
    } else if (uGroup == 1) {
        float f4 = texture(uSelf, vUv - vec2(0.0, -1.0) * uTexelSize).x;
        float f5 = texture(uSelf, vUv - vec2(1.0, 1.0) * uTexelSize).y;
        float f6 = texture(uSelf, vUv - vec2(-1.0, 1.0) * uTexelSize).z;
        float f7 = texture(uSelf, vUv - vec2(-1.0, -1.0) * uTexelSize).w;
        outColor = vec4(f4, f5, f6, f7);
    } else {
        float f8 = texture(uSelf, vUv - vec2(1.0, -1.0) * uTexelSize).x;
        outColor = vec4(f8, 0.0, 0.0, 0.0);
    }
}