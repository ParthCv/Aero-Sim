#version 300 es
precision highp float;

uniform sampler2D uF0to3;
uniform sampler2D uF4to7;
uniform sampler2D uF8;
uniform sampler2D uMask;
uniform vec2 uTexelSize;
uniform int uGroup;
uniform vec2 uInletVelocity;
uniform float uInletDensity;

in vec2 vUv;
out vec4 outColor;

float feq(vec2 e, float w, float rho, vec2 u) {
  float eu = dot(e, u);
  float uu = dot(u, u);
  return w * rho * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * uu);
}

void main() {
    bool isLeftEdge = vUv.x < uTexelSize.x;
    bool isRightEdge = vUv.x > 1.0 - uTexelSize.x;
    bool isBottomEdge = vUv.y < uTexelSize.y;
    bool isTopEdge = vUv.y > 1.0 - uTexelSize.y;

    vec4 own0 = texture(uF0to3, vUv);
    vec4 own1 = texture(uF4to7, vUv);
    vec4 own2 = texture(uF8, vUv);

    // ---------- LEFT EDGE: damped inlet forcing ----------
    if (isLeftEdge) {
        float rho = uInletDensity;
        vec2 uTarget = uInletVelocity;
        float blend = 0.3;

        if (uGroup == 0) {
            vec4 targetEq = vec4(
                feq(vec2( 0.0,  0.0), 4.0 / 9.0,  rho, uTarget),
                feq(vec2( 1.0,  0.0), 1.0 / 9.0,  rho, uTarget),
                feq(vec2( 0.0,  1.0), 1.0 / 9.0,  rho, uTarget),
                feq(vec2(-1.0,  0.0), 1.0 / 9.0,  rho, uTarget)
            );
            outColor = own0 - blend * (own0 - targetEq);
        } else if (uGroup == 1) {
            vec4 targetEq = vec4(
                feq(vec2( 0.0, -1.0), 1.0 / 9.0,  rho, uTarget),
                feq(vec2( 1.0,  1.0), 1.0 / 36.0, rho, uTarget),
                feq(vec2(-1.0,  1.0), 1.0 / 36.0, rho, uTarget),
                feq(vec2(-1.0, -1.0), 1.0 / 36.0, rho, uTarget)
            );
            outColor = own1 - blend * (own1 - targetEq);
        } else {
            float targetEq8 = feq(vec2(1.0, -1.0), 1.0 / 36.0, rho, uTarget);
            outColor = vec4(own2.x - blend * (own2.x - targetEq8), 0.0, 0.0, 0.0);
        }
        return;
    }

    // ---------- RIGHT EDGE: damped convective outflow ----------
    if (isRightEdge) {
        vec2 leftUv = vUv - vec2(uTexelSize.x, 0.0);
        float blend = 0.45;

        if (uGroup == 0) {
            float f0 = own0.x;
            float f1 = texture(uF0to3, leftUv).y;
            float f2 = texture(uF0to3, vUv - vec2(0.0, uTexelSize.y)).z;
            float f3n = texture(uF0to3, leftUv).w;
            float f3 = own0.w - blend * (own0.w - f3n);
            outColor = vec4(f0, f1, f2, f3);
        } else if (uGroup == 1) {
            float f4 = texture(uF4to7, vUv - vec2(0.0, -uTexelSize.y)).x;
            float f5 = texture(uF4to7, vUv - vec2(uTexelSize.x, uTexelSize.y)).y;
            float f6n = texture(uF4to7, leftUv).z;
            float f7n = texture(uF4to7, leftUv).w;
            float f6 = own1.z - blend * (own1.z - f6n);
            float f7 = own1.w - blend * (own1.w - f7n);
            outColor = vec4(f4, f5, f6, f7);
        } else {
            float f8 = texture(uF8, vUv - vec2(uTexelSize.x, -uTexelSize.y)).x;
            outColor = vec4(f8, 0.0, 0.0, 0.0);
        }
        return;
    }

    // ---------- BOTTOM EDGE: solid no-slip ground (full bounce-back) ----------
    if (isBottomEdge) {
        if (uGroup == 0) {
            // f2 (0,+1) has no real neighbor below — bounce from f4 (0,-1), which we own
            outColor = vec4(own0.x, own0.y, own1.x, own0.w);
        } else if (uGroup == 1) {
            // f5 (+1,+1) bounced from f7 (-1,-1); f6 (-1,+1) bounced from f8 (+1,-1)
            outColor = vec4(own1.x, own1.w, own2.x, own1.y);
        } else {
            // f8 (+1,-1) has no real neighbor below — bounce from f6 (-1,+1), which we own
            outColor = vec4(own1.z, 0.0, 0.0, 0.0);
        }
        return;
    }

    // ---------- TOP EDGE: open sky, damped convective outflow ----------
    if (isTopEdge) {
        vec2 belowUv = vUv - vec2(0.0, uTexelSize.y);
        float blend = 0.2;

        if (uGroup == 0) {
            float f0 = own0.x;
            float f1 = texture(uF0to3, vUv - vec2(uTexelSize.x, 0.0)).y;
            float f3 = texture(uF0to3, vUv + vec2(uTexelSize.x, 0.0)).w;
            float f2n = texture(uF0to3, belowUv).z;
            float f2 = own0.z - blend * (own0.z - f2n);
            outColor = vec4(f0, f1, f2, f3);
        } else if (uGroup == 1) {
            float f4 = texture(uF4to7, belowUv + vec2(0.0, -uTexelSize.y)).x; // from further below, normal stream
            float f5n = texture(uF4to7, belowUv).y;
            float f6n = texture(uF4to7, belowUv).z;
            float f7 = texture(uF4to7, vUv + vec2(uTexelSize.x, -uTexelSize.y)).w; // streams normally from SE
            float f5 = own1.y - blend * (own1.y - f5n);
            float f6 = own1.z - blend * (own1.z - f6n);
            outColor = vec4(f4, f5, f6, f7);
        } else {
            float f8 = texture(uF8, vUv - vec2(uTexelSize.x, -uTexelSize.y)).x; // streams normally from NW... wait see note
            outColor = vec4(f8, 0.0, 0.0, 0.0);
        }
        return;
    }

    // ---------- INTERIOR: unchanged, your existing correct mask bounce-back ----------
    if (uGroup == 0) {
        float f0 = own0.x;
        vec2 src1 = vUv - vec2(1.0, 0.0) * uTexelSize;
        float solid1 = texture(uMask, src1).r;
        float f1 = mix(texture(uF0to3, src1).y, own0.w, solid1);
        vec2 src2 = vUv - vec2(0.0, 1.0) * uTexelSize;
        float solid2 = texture(uMask, src2).r;
        float f2 = mix(texture(uF0to3, src2).z, own1.x, solid2);
        vec2 src3 = vUv - vec2(-1.0, 0.0) * uTexelSize;
        float solid3 = texture(uMask, src3).r;
        float f3 = mix(texture(uF0to3, src3).w, own0.y, solid3);
        outColor = vec4(f0, f1, f2, f3);
    } else if (uGroup == 1) {
        vec2 src4 = vUv - vec2(0.0, -1.0) * uTexelSize;
        float solid4 = texture(uMask, src4).r;
        float f4 = mix(texture(uF4to7, src4).x, own0.z, solid4);
        vec2 src5 = vUv - vec2(1.0, 1.0) * uTexelSize;
        float solid5 = texture(uMask, src5).r;
        float f5 = mix(texture(uF4to7, src5).y, own1.w, solid5);
        vec2 src6 = vUv - vec2(-1.0, 1.0) * uTexelSize;
        float solid6 = texture(uMask, src6).r;
        float f6 = mix(texture(uF4to7, src6).z, own2.x, solid6);
        vec2 src7 = vUv - vec2(-1.0, -1.0) * uTexelSize;
        float solid7 = texture(uMask, src7).r;
        float f7 = mix(texture(uF4to7, src7).w, own1.y, solid7);
        outColor = vec4(f4, f5, f6, f7);
    } else {
        vec2 src8 = vUv - vec2(1.0, -1.0) * uTexelSize;
        float solid8 = texture(uMask, src8).r;
        float f8 = mix(texture(uF8, src8).x, own1.z, solid8);
        outColor = vec4(f8, 0.0, 0.0, 0.0);
    }
}