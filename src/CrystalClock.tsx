import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getCameraDistance, getHourDirection, getHourFill, getOrbPosition } from './clockMath';

const TUBE_COUNT = 12;
const TUBE_LENGTH = 2;
const TUBE_RADIUS = 0.14;
const CENTER_GAP = 0.9;
const ORB_COUNT = 7;
const TRAIL_LENGTH = 96;
const TRAIL_DURATION = 1.5;

function localSeconds(now: Date): number {
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
}

function WormholeTunnel() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;

      float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p = turn * p * 2.03 + 4.7;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
        float radius = length(p);
        float depth = 0.45 / sqrt(radius * radius + 0.0004);
        float twist = depth * 0.3 - uTime * 0.025;
        mat2 turn = mat2(cos(twist), -sin(twist), sin(twist), cos(twist));
        // Advancing the depth coordinate makes cloud features expand outward
        // from the vanishing point, like moving forward through a tunnel.
        float travel = depth + uTime * 0.45;
        vec2 wall = turn * (p / max(radius, 0.001)) * 2.6;
        wall += vec2(travel * 1.3, travel * 0.8);
        float clouds = fbm(wall + fbm(wall * 1.7) * 1.1);
        float detail = fbm(wall * 2.4 + vec2(travel * 0.3, -travel * 0.2));
        float opening = smoothstep(0.025, 0.35, radius);
        float light = smoothstep(0.2, 0.85, clouds * 0.75 + detail * 0.25);
        vec3 color = mix(vec3(0.025, 0.013, 0.05), vec3(0.12, 0.065, 0.19), light);
        color *= mix(0.2, 1.0, opening);
        color *= 1.0 - smoothstep(0.45, 1.1, radius) * 0.4;
        // Distant detail fades out before the polar mapping converges.
        color = mix(vec3(0.006, 0.003, 0.014), color, smoothstep(0.04, 0.14, radius));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  }), []);

  useFrame(({ clock, size }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} args={[shaderData]} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function Orb({ index }: { index: number }) {
  const orbRef = useRef<THREE.Group>(null);
  const trail = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TRAIL_LENGTH * 6), 3));
    geometry.setAttribute('trailTangent', new THREE.Float32BufferAttribute(new Float32Array(TRAIL_LENGTH * 6), 3));
    const uvs = new Float32Array(TRAIL_LENGTH * 4);
    const indices = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const progress = i / (TRAIL_LENGTH - 1);
      uvs.set([progress, 0, progress, 1], i * 4);
      if (i < TRAIL_LENGTH - 1) {
        const vertex = i * 2;
        indices.push(vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2);
      }
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 trailTangent;
        varying vec2 vTrailUv;

        void main() {
          vTrailUv = uv;
          vec4 center = modelViewMatrix * vec4(position, 1.0);
          vec3 tangent = (modelViewMatrix * vec4(trailTangent, 0.0)).xyz;
          vec2 side = vec2(-tangent.y, tangent.x);
          side /= max(length(side), 0.00001);
          float width = 0.055 * mix(1.0, 0.15, uv.x);
          center.xy += side * (uv.y - 0.5) * width;
          gl_Position = projectionMatrix * center;
        }
      `,
      fragmentShader: `
        varying vec2 vTrailUv;

        void main() {
          float across = abs(vTrailUv.y * 2.0 - 1.0);
          float core = exp(-across * across * 10.0);
          float halo = exp(-across * across * 2.0) * (1.0 - smoothstep(0.65, 1.0, across));
          // Interpolation can overshoot the tail endpoint and feed NaNs into bloom.
          float fade = pow(clamp(1.0 - vTrailUv.x, 0.0, 1.0), 1.15);
          vec3 color = (vec3(0.35, 1.15, 2.8) * core + vec3(0.05, 0.2, 0.6) * halo) * fade;
          gl_FragColor = vec4(color, 1.0);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      forceSinglePass: true,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  }, []);
  const transmissionTrail = useMemo(() => {
    const material = trail.material.clone();
    material.transparent = false;
    material.colorWrite = false;
    const mesh = new THREE.Mesh(trail.geometry, material);
    mesh.frustumCulled = false;
    mesh.onBeforeRender = renderer => {
      // Three's mipmapped transmission target needs the rear trails, but
      // the main scene must blend its depth-tested trails after the glass.
      material.colorWrite = renderer.getRenderTarget()?.texture.generateMipmaps === true;
    };
    return mesh;
  }, [trail]);

  useEffect(() => () => {
    trail.geometry.dispose();
    trail.material.dispose();
    transmissionTrail.material.dispose();
  }, [trail, transmissionTrail]);

  useFrame(() => {
    const seconds = localSeconds(new Date());
    orbRef.current?.position.set(...getOrbPosition(seconds, index));
    const positions = trail.geometry.getAttribute('position');
    const tangents = trail.geometry.getAttribute('trailTangent');
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const point = getOrbPosition(seconds - (i / (TRAIL_LENGTH - 1)) * TRAIL_DURATION, index);
      positions.setXYZ(i * 2, ...point);
      positions.setXYZ(i * 2 + 1, ...point);
    }
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const previous = Math.max(i - 1, 0) * 2;
      const next = Math.min(i + 1, TRAIL_LENGTH - 1) * 2;
      const x = positions.getX(next) - positions.getX(previous);
      const y = positions.getY(next) - positions.getY(previous);
      const z = positions.getZ(next) - positions.getZ(previous);
      tangents.setXYZ(i * 2, x, y, z);
      tangents.setXYZ(i * 2 + 1, x, y, z);
    }
    positions.needsUpdate = true;
    tangents.needsUpdate = true;
  });

  return (
    <>
      <group ref={orbRef}>
        <mesh>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color={[1.8, 2.5, 3]} toneMapped={false} />
        </mesh>
        <pointLight color="#b5e7ff" intensity={0.35} distance={4} decay={2} />
      </group>
      <primitive object={transmissionTrail} />
      <primitive object={trail} />
    </>
  );
}

function CrystalRod({ index }: { index: number }) {
  const rodRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const outline = new THREE.Shape();
    for (let side = 0; side < 6; side++) {
      const angle = side * Math.PI / 3;
      const x = Math.cos(angle) * (TUBE_RADIUS - 0.012);
      const y = Math.sin(angle) * (TUBE_RADIUS - 0.012);
      if (side === 0) outline.moveTo(x, y);
      else outline.lineTo(x, y);
    }
    outline.closePath();
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: TUBE_LENGTH - 0.04,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.012,
      bevelSegments: 1,
      steps: 1,
    });
    geometry.center();
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  const { material, uniforms } = useMemo(() => {
    const uniforms = {
      uCrystalFill: { value: 0 },
      uCrystalActive: { value: 0 },
    };
    const material = new THREE.MeshPhysicalMaterial({
      color: '#d5eaff',
      roughness: 0.03,
      metalness: 0,
      transmission: 0.96,
      thickness: TUBE_RADIUS * 2,
      ior: 1.6,
      attenuationColor: new THREE.Color('#2877c7'),
      attenuationDistance: 3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.024,
      envMapIntensity: 1.7,
      side: THREE.DoubleSide,
      depthWrite: true,
      toneMapped: false,
    });
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vCrystalHeight;')
        .replace('#include <begin_vertex>', `
          #include <begin_vertex>
          vCrystalHeight = position.y / ${TUBE_LENGTH.toFixed(1)} + 0.5;
        `);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `
          #include <common>
          uniform float uCrystalFill;
          uniform float uCrystalActive;
          varying float vCrystalHeight;
        `)
        .replace('#include <emissivemap_fragment>', `
          #include <emissivemap_fragment>
          float surfaceWidth = max(fwidth(vCrystalHeight), 0.0005);
          float liquid = 1.0 - smoothstep(
            uCrystalFill - surfaceWidth, uCrystalFill + surfaceWidth, vCrystalHeight
          );
          liquid *= uCrystalActive * step(0.0001, uCrystalFill);
          float core = pow(abs(dot(normal, normalize(vViewPosition))), 4.0);
          totalEmissiveRadiance += vec3(0.3, 1.3, 2.0) * (0.8 + core * 0.8) * liquid;
        `);
    };
    return { material, uniforms };
  }, []);

  useEffect(() => () => {
    material.dispose();
    geometry.dispose();
  }, [material, geometry]);

  useFrame(() => {
    const seconds = localSeconds(new Date());
    if (rodRef.current) rodRef.current.rotation.y = (seconds * Math.PI) / 15 + index * Math.PI / 6;
    uniforms.uCrystalActive.value = Math.floor(seconds / 3600) % 12 === index ? 1 : 0;
    uniforms.uCrystalFill.value = getHourFill(seconds % 3600);
  });

  return (
    <group rotation={[0, 0, -(index / TUBE_COUNT) * Math.PI * 2]}>
      <mesh
        ref={rodRef}
        position={[0, CENTER_GAP + TUBE_LENGTH / 2, 0]}
        material={material}
        geometry={geometry}
      />
    </group>
  );
}

function ClockGroup() {
  const faceRef = useRef<THREE.Group>(null);
  const axis = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const seconds = localSeconds(new Date());
    axis.set(...getHourDirection(Math.floor(seconds / 3600) % 12));
    faceRef.current?.quaternion.setFromAxisAngle(axis, ((seconds % 60) / 60) * Math.PI * 2);
  });

  return (
    <>
      <group ref={faceRef}>
        {Array.from({ length: TUBE_COUNT }, (_, index) => <CrystalRod key={index} index={index} />)}
      </group>
      {Array.from({ length: ORB_COUNT }, (_, index) => <Orb key={index} index={index} />)}
    </>
  );
}

function CameraFraming() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 0, getCameraDistance(size.width / size.height, camera.fov));
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
  return null;
}

export function CrystalClock() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#100820']} />
      <CameraFraming />
      <WormholeTunnel />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#304d86']} />
        <Lightformer position={[-4, 3, 4]} target={[0, 0, 0]} scale={[4, 6, 1]} color="#b5e7ff" intensity={4} />
        <Lightformer position={[4, -2, 1]} target={[0, 0, 0]} scale={[4, 6, 1]} color="#7954ff" intensity={3} />
        <Lightformer position={[0, 4, -3]} target={[0, 0, 0]} scale={[5, 1, 1]} color="#378bff" intensity={2} />
      </Environment>
      <ClockGroup />
      <EffectComposer>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.3} intensity={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
