#version 300 es
precision highp float;

uniform float uDensity;
uniform vec2 uVelocity;
uniform int uGroup; // 0 - f0-f4, 1 - f4-f7, 2 - f8

out vec4 outColor;

float feq(vec2 e, float w, float rho, vec2 u) {
    float eu = dot(e, u);
    float uu = dot(u, u);
    return w * rho * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * uu);
}


void main() {
    float rho = uDensity;
    vec2 u = uVelocity;

    if (uGroup == 0) {
        outColor = vec4(
            feq(vec2(0.0, 0.0), 4.0/9.0, rho, u),
            feq(vec2(1.0, 0.0), 1.0/9.0, rho, u),
            feq(vec2(0.0, 1.0), 1.0/9.0, rho, u),
            feq(vec2(-1.0, 0.0), 1.0/9.0, rho, u)
        );
        return;
    } else if (uGroup == 1) {
        outColor = vec4(
            feq(vec2(0.0, -1.0), 1.0/9.0, rho, u),
            feq(vec2(1.0, 1.0), 1.0/36.0, rho, u),
            feq(vec2(-1.0, 1.0), 1.0/36.0, rho, u),
            feq(vec2(-1.0, -1.0), 1.0/36.0, rho, u)
        );
        return;
    } else {
        outColor = vec4(feq(vec2(1.0, -1.0), 1.0/36.0, rho, u), 0.0, 0.0, 0.0);
        return;
    }
}