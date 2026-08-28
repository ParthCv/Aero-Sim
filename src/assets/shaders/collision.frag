#version 300 es
precision highp float;

uniform sampler2D uF0to3;
uniform sampler2D uF4to7;
uniform sampler2D uF8;
uniform float uTau;
uniform int uGroup; // 0 - f0..f3, 1 - f4..f7, 2 - f8

in vec2 vUv;
out vec4 outColor;

float feq(vec2 e, float w, float rho, vec2 u) {
    float eu = dot(e, u);
    float uu = dot(u, u);
    return w * rho * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * uu);
}

// BGK using multiplication instead of division
float collide(float f, float feqVal, float invTau) {
    return f - (f - feqVal) * invTau;
}

void main() {
    vec4 g0 = texture(uF0to3, vUv);
    vec4 g1 = texture(uF4to7, vUv);
    vec4 g2 = texture(uF8, vUv);

    float rho = g0.x + g0.y + g0.z + g0.w +
                g1.x + g1.y + g1.z + g1.w + g2.x;

    vec2 momentum =
        g0.y * vec2( 1.0,  0.0) + g0.z * vec2( 0.0,  1.0) +
        g0.w * vec2(-1.0,  0.0) + g1.x * vec2( 0.0, -1.0) +
        g1.y * vec2( 1.0,  1.0) + g1.z * vec2(-1.0,  1.0) +
        g1.w * vec2(-1.0, -1.0) + g2.x * vec2( 1.0, -1.0);

    vec2 u = momentum / rho;
    float invTau = 1.0 / uTau;

    if (uGroup == 0) {
        outColor = vec4(
            collide(g0.x, feq(vec2( 0.0,  0.0), 4.0 / 9.0, rho, u), invTau),
            collide(g0.y, feq(vec2( 1.0,  0.0), 1.0 / 9.0, rho, u), invTau),
            collide(g0.z, feq(vec2( 0.0,  1.0), 1.0 / 9.0, rho, u), invTau),
            collide(g0.w, feq(vec2(-1.0,  0.0), 1.0 / 9.0, rho, u), invTau)
        );
    } else if (uGroup == 1) {
        outColor = vec4(
            collide(g1.x, feq(vec2( 0.0, -1.0), 1.0 / 9.0, rho, u), invTau),
            collide(g1.y, feq(vec2( 1.0,  1.0), 1.0 / 36.0, rho, u), invTau),
            collide(g1.z, feq(vec2(-1.0,  1.0), 1.0 / 36.0, rho, u), invTau),
            collide(g1.w, feq(vec2(-1.0, -1.0), 1.0 / 36.0, rho, u), invTau)
        );
    } else {
        outColor = vec4(
            collide(g2.x, feq(vec2( 1.0, -1.0), 1.0 / 36.0, rho, u), invTau),
            0.0,
            0.0,
            0.0
        );
    }
}