#version 300 es
precision highp float;

uniform sampler2D uF0to3;
uniform sampler2D uF4to7;
uniform sampler2D uF8;

in vec3 vUv;
out vec4 outColor;

void main() {
    vec4 g0 = texture(uF0to3, uVu);
    vec4 g1 = texture(uF4to7, uVu);
    vec4 g2 = texture(uF8, uVu);

    float rho = g0.x + g0.y + g0.z + g0.w +
        g1.x + g1.y + g1.z + g1.w + g2.x;

    float momentum =
        g0.y * vec2( 1.0,  0.0) + g0.z * vec2( 0.0,  1.0) +
        g0.w * vec2(-1.0,  0.0) + g1.x * vec2( 0.0, -1.0) +
        g1.y * vec2( 1.0,  1.0) + g1.z * vec2(-1.0,  1.0) +
        g1.w * vec2(-1.0, -1.0) + g2.x * vec2( 1.0, -1.0);

    vec2 velocity = momentum / rho;
    outColor = vec4(rho, velocity.x, velocity.y, 1.0)
}