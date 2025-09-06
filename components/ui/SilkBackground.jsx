"use client";
/* eslint-disable react/no-unknown-property */
import React, { forwardRef, useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color } from "three";
import { cn } from "@/lib/utils";

const hexToNormalizedRGB = (hex) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

const SilkPlane = forwardRef(function SilkPlane({ uniforms }, ref) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    const mesh = ref;
    if (mesh.current) {
      mesh.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_state, delta) => {
    const mesh = ref;
    if (mesh.current) {
      const material = mesh.current.material;
      material.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = "SilkPlane";

export const SilkBackground = forwardRef(
  ({ className, speed = 9, scale = 1, color = "#7B7481", noiseIntensity = 1, rotation = 0, ...props }, ref) => {
    // props already contains only DOM props after destructuring above
    const domProps = props;

    const meshRef = useRef(null);

    const uniforms = useMemo(
      () => ({
        uSpeed: { value: speed },
        uScale: { value: scale },
        uNoiseIntensity: { value: noiseIntensity },
        uColor: { value: new Color(...hexToNormalizedRGB(color)) },
        uRotation: { value: rotation },
        uTime: { value: 0 },
      }),
      [speed, scale, noiseIntensity, color, rotation]
    );

    return (
      <div ref={ref} className={cn("w-full h-full relative", className)} {...domProps}>
        <Canvas dpr={[1, 2]} frameloop="always" className="w-full h-full">
          <SilkPlane ref={meshRef} uniforms={uniforms} />
        </Canvas>
      </div>
    );
  }
);

SilkBackground.displayName = "SilkBackground";
