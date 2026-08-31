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
    bool isLeftEdge = vUv.x < uTexelSize.x * 0.5;
    bool isRightEdge = vUv.x > 1.0 - uTexelSize.x * 2.0;
        
    vec4 own0 = texture(uF0to3, vUv);
    vec4 own1 = texture(uF4to7, vUv);
    vec4 own2 = texture(uF8, vUv);

    if (isLeftEdge) {
        float rho = uInletDensity;
        vec2 u = uInletVelocity;

        if (uGroup == 0) {
            outColor = vec4(
                feq(vec2( 0.0,  0.0), 4.0 / 9.0,  rho, u),
                feq(vec2( 1.0,  0.0), 1.0 / 9.0,  rho, u),
                feq(vec2( 0.0,  1.0), 1.0 / 9.0,  rho, u),
                feq(vec2(-1.0,  0.0), 1.0 / 9.0,  rho, u)
            );
        }  else if (uGroup == 1) {
            outColor = vec4(
                feq(vec2( 0.0, -1.0), 1.0 / 9.0,  rho, u),
                feq(vec2( 1.0,  1.0), 1.0 / 36.0, rho, u),
                feq(vec2(-1.0,  1.0), 1.0 / 36.0, rho, u),
                feq(vec2(-1.0, -1.0), 1.0 / 36.0, rho, u)
            );
        } else {
            outColor = vec4(feq(vec2(1.0, -1.0), 1.0 / 36.0, rho, u), 0.0, 0.0, 0.0);
        }
        return;
    }

    if (isRightEdge) {
        vec2 srcUv = vUv - vec2(uTexelSize.x, 0.0); // interior neighbor 1 step to the left

        if (uGroup == 0) {
            float f0 = own0.x;
            float f1 = texture(uF0to3, vUv - vec2( uTexelSize.x, 0.0)).y; // stream from left
            float f2 = texture(uF0to3, vUv - vec2(0.0,  uTexelSize.y)).z; // stream from below
            float f3 = texture(uF0to3, srcUv).w;                          // extrapolate left-moving
            
            outColor = vec4(f0, f1, f2, f3);
        } else if (uGroup == 1) {
            float f4 = texture(uF4to7, vUv - vec2(0.0, -uTexelSize.y)).x; // stream from above
            float f5 = texture(uF4to7, vUv - vec2( uTexelSize.x,  uTexelSize.y)).y; // stream from SW
            float f6 = texture(uF4to7, srcUv).z;                          // extrapolate NW-moving
            float f7 = texture(uF4to7, srcUv).w;                          // extrapolate SW-moving
            
            outColor = vec4(f4, f5, f6, f7);
        } else {
            float f8 = texture(uF8, vUv - vec2(uTexelSize.x, -uTexelSize.y)).x; // stream from NW
            
            outColor = vec4(f8, 0.0, 0.0, 0.0);
        }
        return;
    }

    if (uGroup == 0) {
        float f0 = own0.x;

        vec2 src1 = vUv - vec2(1.0, 0.0) * uTexelSize;
        float solid1 = texture(uMask, src1).r;
        float f1 = mix(texture(uF0to3, src1).y, own0.w, solid1); // opposite: f3

        vec2 src2 = vUv - vec2(0.0, 1.0) * uTexelSize;
        float solid2 = texture(uMask, src2).r;
        float f2 = mix(texture(uF0to3, src2).z, own1.x, solid2); // opposite: f4

        vec2 src3 = vUv - vec2(-1.0, 0.0) * uTexelSize;
        float solid3 = texture(uMask, src3).r;
        float f3 = mix(texture(uF0to3, src3).w, own0.y, solid3); // opposite: f1
        
        outColor = vec4(f0, f1, f2, f3);
    } else if (uGroup == 1) {
        vec2 src4 = vUv - vec2(0.0, -1.0) * uTexelSize;
        float solid4 = texture(uMask, src4).r;
        float f4 = mix(texture(uF4to7, src4).x, own0.z, solid4); // opposite: f2

        vec2 src5 = vUv - vec2(1.0, 1.0) * uTexelSize;
        float solid5 = texture(uMask, src5).r;
        float f5 = mix(texture(uF4to7, src5).y, own1.w, solid5); // opposite: f7

        vec2 src6 = vUv - vec2(-1.0, 1.0) * uTexelSize;
        float solid6 = texture(uMask, src6).r;
        float f6 = mix(texture(uF4to7, src6).z, own2.x, solid6); // opposite: f8

        vec2 src7 = vUv - vec2(-1.0, -1.0) * uTexelSize;
        float solid7 = texture(uMask, src7).r;
        float f7 = mix(texture(uF4to7, src7).w, own1.y, solid7); // opposite: f5
        outColor = vec4(f4, f5, f6, f7);
    } else {
        vec2 src8 = vUv - vec2(1.0, -1.0) * uTexelSize;
        float solid8 = texture(uMask, src8).r;
        float f8 = mix(texture(uF8, src8).x, own1.z, solid8); // opposite: f6
        outColor = vec4(f8, 0.0, 0.0, 0.0);
    }
}