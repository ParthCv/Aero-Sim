#version 300 es
precision highp float;

uniform sampler2D uMacro;

in vec2 vUv;
out vec4 outColor;

vec3 jetColormap(float t) {
  t = clamp(t, 0.0, 1.0);
  float r = clamp(1.5 - abs(4.0 * t - 3.0), 0.0, 1.0);
  float g = clamp(1.5 - abs(4.0 * t - 2.0), 0.0, 1.0);
  float b = clamp(1.5 - abs(4.0 * t - 1.0), 0.0, 1.0);
  return vec3(r, g, b);
}

void main() {
    vec4 macro = texture(uMacro, vUv);
    float speed = length(macro.gb);
    float t = clamp(speed / 0.2, 0.0, 1.0);
    outColor = vec4(jetColormap(t), 1.0);
}