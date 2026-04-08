import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const TUBE_COUNT = 12;
const TUBE_LENGTH = 2.0;
const TUBE_RADIUS = 0.14;
const CENTER_GAP = 0.75; // where rods start (replaces SPHERE_RADIUS)
const ORB_COUNT = 7;

/**
 * LCD grouping for the PS2 clock orbs.
 * Returns the number of visible orb groups based on the lowest common
 * denominator of 60 that divides evenly into the current second.
 */
function getOrbGroupCount(seconds: number): number {
  if (seconds % 60 === 0) return 1;
  if (seconds % 30 === 0) return 2;
  if (seconds % 20 === 0) return 3;
  if (seconds % 15 === 0) return 4;
  if (seconds % 12 === 0) return 5;
  if (seconds % 10 === 0) return 6;
  return 7;
}

/**
 * Find the nearest grouping second and the distance to it.
 * Grouping seconds are: 0,10,12,15,20,24,30,36,40,45,48,50,60
 */
const GROUPING_SECONDS = [0, 10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 50, 60];

function nearestGroupingDistance(exactSecond: number): { nearest: number; dist: number; groupCount: number } {
  let bestDist = 60;
  let bestSec = 0;
  for (const gs of GROUPING_SECONDS) {
    const d = Math.abs(exactSecond - gs);
    if (d < bestDist) {
      bestDist = d;
      bestSec = gs;
    }
  }
  return { nearest: bestSec % 60, dist: bestDist, groupCount: getOrbGroupCount(bestSec % 60) };
}

/**
 * Fullscreen wormhole tunnel — a ray-marched infinite tunnel with
 * highly textured cloudy/cottony walls and perspective depth.
 * Creates the feeling of flying through a never-ending passage.
 */
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
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;

      // High quality noise
      float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic interp
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      // Layered fractal noise for cottony texture
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 7; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      // Wispy cloud pattern with turbulence
      float cloudPattern(vec2 p, float t) {
        float n1 = fbm(p + vec2(t * 0.1, t * 0.05));
        float n2 = fbm(p * 1.5 + vec2(-t * 0.08, t * 0.12) + n1 * 0.5);
        float n3 = fbm(p * 0.7 + vec2(t * 0.06, -t * 0.04) + n2 * 0.3);
        return n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      }

      void main() {
        vec2 uv = vUv - 0.5;
        float aspect = uResolution.x / uResolution.y;

        // Distance from center — computed before aspect correction for circular shape
        float dist = length(uv);

        uv.x *= aspect;

        // Tunnel depth: map radial distance to Z depth
        // Closer to center = farther away in the tunnel
        float depth = 0.5 / (dist + 0.05);

        // Angle around the tunnel — use normalized coords to avoid atan seam
        float angle = atan(uv.y, uv.x);

        // Seamless angular coordinate: sample noise in 2D using cos/sin
        // instead of raw angle, so there's no discontinuity at ±PI
        float tunnelSpeed = uTime * 0.4;
        float angFreq = 2.0;
        vec2 angCoord = vec2(cos(angle * angFreq), sin(angle * angFreq));

        // Tunnel UV using seamless angular + depth
        vec2 tunnelUV = vec2(
          angCoord.x + angCoord.y * 0.5,
          depth + tunnelSpeed
        );
        // Second seamless coord for variety
        vec2 tunnelUV2 = vec2(
          angCoord.x * 0.7 - angCoord.y * 0.3 + 3.0,
          depth * 1.3 + tunnelSpeed * 0.8
        );

        // Multi-layered cloud texture at different scales
        float cloud1 = cloudPattern(tunnelUV * 1.5, uTime * 0.3);
        float cloud2 = cloudPattern(tunnelUV2 * 2.5 + 5.0, uTime * 0.2);
        float cloud3 = cloudPattern(tunnelUV * 0.8 + tunnelUV2 * 0.4 + 10.0, uTime * 0.15);

        // Combine clouds with emphasis on fine detail
        float clouds = cloud1 * 0.4 + cloud2 * 0.35 + cloud3 * 0.25;

        // Add wispy streaks along the tunnel
        float streaks = noise(vec2(angCoord.x * 6.0 + angCoord.y * 3.0, depth * 2.0 + tunnelSpeed * 0.5));
        streaks = pow(streaks, 2.0) * 0.3;
        clouds += streaks;

        // Color palette: dark purple/blue with high-contrast clouds
        vec3 darkPurple = vec3(0.03, 0.01, 0.06);
        vec3 midPurple = vec3(0.14, 0.09, 0.25);
        vec3 lightLavender = vec3(0.30, 0.22, 0.48);
        vec3 blueHint = vec3(0.08, 0.10, 0.22);

        // High contrast: sharpen cloud edges
        float sharpClouds = smoothstep(0.3, 0.7, clouds);
        vec3 color = mix(darkPurple, midPurple, sharpClouds);
        color = mix(color, lightLavender, pow(clouds, 3.0) * 0.6);
        color = mix(color, blueHint, streaks * 0.5);

        // Modulate brightness with texture for that cottony feel
        color *= 0.25 + clouds * 0.6;

        // Subtle center glow — the distant tunnel opening
        float centerGlow = smoothstep(0.2, 0.0, dist);
        centerGlow = pow(centerGlow, 2.5);
        vec3 glowColor = vec3(0.18, 0.12, 0.30);
        color = mix(color, glowColor, centerGlow * 0.4);

        // Depth fog toward center
        float fog = smoothstep(0.35, 0.02, dist);
        vec3 fogColor = vec3(0.10, 0.06, 0.18);
        color = mix(color, fogColor, fog * 0.5);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }), []);

  const { size } = useThree();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh position={[0, 0, -5]} renderOrder={-1}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial
        ref={materialRef}
        args={[shaderData]}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/**
 * Procedural environment map for crystal reflections.
 * Creates a simple purple-blue gradient cubemap.
 */
function CrystalEnvMap() {
  const { scene } = useThree();

  useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);

    // Create a simple gradient texture
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const fx = x / size;
        const fy = y / size;
        // Purple-blue gradient
        data[i] = Math.floor(30 + fx * 40 + fy * 20);      // R
        data[i + 1] = Math.floor(20 + fx * 30 + fy * 40);  // G
        data[i + 2] = Math.floor(60 + fx * 60 + fy * 80);  // B
        data[i + 3] = 255;                                   // A
      }
    }

    const texture = new THREE.DataTexture(data, size, size);
    texture.needsUpdate = true;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;

    return () => {
      scene.environment = null;
      texture.dispose();
    };
  }, [scene]);

  return null;
}

const TRAIL_LENGTH = 20; // more segments, closely spaced for a smooth smear

/**
 * 7 flying orbs with comet-like tails, gliding in smooth spherical orbits.
 * Each orb has its own unique orbit parameters for natural-looking motion.
 * Grouping offsets are smoothly interpolated so LCD transitions are seamless.
 */
function Orbs() {
  const orbRefs = useRef<THREE.Mesh[]>([]);
  const trailRefs = useRef<THREE.Mesh[]>([]);
  const posHistory = useRef<THREE.Vector3[][]>(
    Array.from({ length: ORB_COUNT }, () =>
      Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3())
    )
  );

  // Each orb has unique orbital parameters for visual variety
  const orbParams = useMemo(() =>
    Array.from({ length: ORB_COUNT }, (_, i) => ({
      thetaSpeed: 2.0 + i * 0.08,
      thetaOffset: (i / ORB_COUNT) * Math.PI * 2,
    })),
  []);

  const trailScales = useMemo(() =>
    Array.from({ length: TRAIL_LENGTH }, (_, i) => {
      const t = i / TRAIL_LENGTH;
      return {
        scale: 0.6 * (1.0 - t * 0.8),
        opacity: 0.25 * Math.pow(1.0 - t, 2),
        emissive: 0.8 * Math.pow(1.0 - t, 2),
      };
    }),
  []);

  const frameCount = useRef(0);

  useFrame(() => {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    // Wall-clock time drives everything — deterministic on refresh
    const exactSecond = s + ms / 1000;
    const totalSeconds = h * 3600 + m * 60 + exactSecond;
    const t = totalSeconds;

    // Orbit radius expands throughout the hour
    const minuteProgress = (m * 60 + s + ms / 1000) / 3600;
    const orbitRadius = 0.2 + minuteProgress * 0.5;

    // Hour-hand angle (analog clock: 12 o'clock = top = -π/2)
    const hourAngle = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;

    // LCD grouping: find nearest grouping second and blend strength
    const { groupCount, dist: groupDist } = nearestGroupingDistance(exactSecond);
    // Smoothly ramp grouping strength: full at 0 distance, fades over ~2 seconds
    const groupWindow = 2.0;
    const groupStrength = Math.max(0, 1.0 - groupDist / groupWindow);
    // Sharpen with smoothstep for a nicer ease
    const smoothGroupStrength = groupStrength * groupStrength * (3 - 2 * groupStrength);

    frameCount.current++;
    const shouldUpdateTrail = frameCount.current % 2 === 0;

    for (let i = 0; i < ORB_COUNT; i++) {
      const orb = orbRefs.current[i];
      if (!orb) continue;

      const params = orbParams[i];

      // --- Free-flying position (driven by wall-clock time) ---
      const theta = t * params.thetaSpeed + params.thetaOffset;

      const freeX = Math.cos(theta) * orbitRadius;
      const freeY = Math.sin(theta) * orbitRadius;

      // 3D precession for spherical swirl
      const tiltAmount = 0.5 + Math.sin(t * 0.15 + i * 0.4) * 0.3;
      const tiltAxis = t * 0.2 + i * 0.9;

      const cosT = Math.cos(tiltAmount);
      const sinT = Math.sin(tiltAmount);
      const cosA = Math.cos(tiltAxis);
      const sinA = Math.sin(tiltAxis);

      const y1 = freeY * cosT;
      const z1Free = freeY * sinT;
      const x2Free = freeX * cosA - y1 * sinA;
      const y2Free = freeX * sinA + y1 * cosA;

      // --- Group target position ---
      const groupIndex = i % groupCount;
      let groupAngle: number;
      if (groupCount === 1) {
        // All orbs converge to the hour-hand position
        groupAngle = hourAngle;
      } else {
        // Distribute group centers evenly around the orbit
        groupAngle = (groupIndex / groupCount) * Math.PI * 2 - Math.PI / 2;
      }

      // Group targets sit on the orbit circle (in XY, no tilt)
      const groupX = Math.cos(groupAngle) * orbitRadius * 0.6;
      const groupY = Math.sin(groupAngle) * orbitRadius * 0.6;
      const groupZ = 0;

      // Blend between free-flying and grouped positions
      const finalX = x2Free + (groupX - x2Free) * smoothGroupStrength;
      const finalY = y2Free + (groupY - y2Free) * smoothGroupStrength;
      const finalZ = z1Free + (groupZ - z1Free) * smoothGroupStrength;

      orb.position.set(finalX, finalY, finalZ);

      if (shouldUpdateTrail) {
        const history = posHistory.current[i];
        for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
          history[j].copy(history[j - 1]);
        }
        history[0].set(finalX, finalY, finalZ);
      }

      const history = posHistory.current[i];
      for (let j = 0; j < TRAIL_LENGTH; j++) {
        const trail = trailRefs.current[i * TRAIL_LENGTH + j];
        if (!trail || !history[j]) continue;
        trail.position.copy(history[j]);
        const sc = trailScales[j].scale;
        trail.scale.set(sc, sc, sc);
      }
    }
  });

  return (
    <group>
      {/* Main orbs */}
      {Array.from({ length: ORB_COUNT }).map((_, i) => (
        <mesh
          key={`orb-${i}`}
          ref={(el) => { if (el) orbRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color="#ddeeff"
            emissive="#ddeeff"
            emissiveIntensity={3}
          />
        </mesh>
      ))}
      {/* Trail segments — smaller fading spheres behind each orb */}
      {Array.from({ length: ORB_COUNT }).map((_, i) =>
        Array.from({ length: TRAIL_LENGTH }).map((_, j) => (
          <mesh
            key={`trail-${i}-${j}`}
            ref={(el) => { if (el) trailRefs.current[i * TRAIL_LENGTH + j] = el; }}
          >
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial
              color="#ddeeff"
              emissive="#ddeeff"
              emissiveIntensity={trailScales[j].emissive}
              transparent
              opacity={trailScales[j].opacity}
              depthWrite={false}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

/**
 * A single hexagonal crystal rod with optional "liquid fill".
 */
function CrystalRod({
  index,
  isCurrentHour,
  fillLevel,
}: {
  index: number;
  isCurrentHour: boolean;
  fillLevel: number;
}) {
  const rodRef = useRef<THREE.Group>(null);
  const angle = (index / TUBE_COUNT) * Math.PI * 2 - Math.PI / 2;
  const dist = CENTER_GAP + 0.15 + TUBE_LENGTH / 2;

  useFrame(({ clock }) => {
    if (rodRef.current) {
      const t = clock.getElapsedTime();
      rodRef.current.rotation.x = t * 0.4 + index * (Math.PI / 6);
    }
  });

  const baseColor = '#1858a0';
  const baseEmissive = '#0a3868';
  const baseEmissiveIntensity = 0.7;

  const fillColor = '#70c8f0';
  const fillEmissive = '#50a8d8';
  const fillEmissiveIntensity = 2.5;

  // Liquid fills from the center end (negative X, close to hub) and drains toward outer tip.
  // fillLevel=1 means full rod is lit, fillLevel→0 means only near-center portion remains.
  const filledLen = TUBE_LENGTH * fillLevel;
  const emptyLen = TUBE_LENGTH - filledLen;
  // Center end is at -TUBE_LENGTH/2, outer tip is at +TUBE_LENGTH/2
  // Filled portion: starts at center end, extends outward
  const filledCenter = -TUBE_LENGTH / 2 + filledLen / 2;
  const emptyCenter = TUBE_LENGTH / 2 - emptyLen / 2;

  return (
    <group rotation={[0, 0, -angle]}>
      <group ref={rodRef} position={[dist, 0, 0]}>
        {isCurrentHour && fillLevel > 0.01 ? (
          <>
            {/* Filled (bright) portion — from outer tip toward center */}
            <mesh position={[filledCenter, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, filledLen, 6]} />
              <meshPhysicalMaterial
                color={fillColor}
                emissive={fillEmissive}
                emissiveIntensity={fillEmissiveIntensity}
                transparent
                opacity={0.9}
                roughness={0.02}
                metalness={0.1}
                transmission={0.3}
                thickness={2.0}
                ior={2.2}
                clearcoat={1}
                clearcoatRoughness={0.01}
                envMapIntensity={2.0}
                specularIntensity={1.5}
                specularColor="#ffffff"
                sheen={0.3}
                sheenColor="#88ccff"
              />
            </mesh>
            {/* Drained portion — still the current hour so retains a glow */}
            {emptyLen > 0.01 && (
              <mesh position={[emptyCenter, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, emptyLen, 6]} />
                <meshPhysicalMaterial
                  color="#2870a0"
                  emissive="#185888"
                  emissiveIntensity={0.9}
                  transparent
                  opacity={0.88}
                  roughness={0.02}
                  metalness={0.12}
                  transmission={0.35}
                  thickness={2.0}
                  ior={2.2}
                  clearcoat={1}
                  clearcoatRoughness={0.01}
                  envMapIntensity={1.8}
                  specularIntensity={1.2}
                  specularColor="#aaddff"
                  sheen={0.3}
                  sheenColor="#4488cc"
                />
              </mesh>
            )}
          </>
        ) : (
          /* Single solid rod */
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_LENGTH, 6]} />
            <meshPhysicalMaterial
              color={baseColor}
              emissive={baseEmissive}
              emissiveIntensity={baseEmissiveIntensity}
              transparent
              opacity={0.9}
              roughness={0.02}
              metalness={0.15}
              transmission={0.35}
              thickness={2.0}
              ior={2.2}
              clearcoat={1}
              clearcoatRoughness={0.01}
              envMapIntensity={2.0}
              specularIntensity={1.5}
              specularColor="#aaddff"
              sheen={0.3}
              sheenColor="#4488cc"
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

/**
 * Main clock assembly.
 */
function ClockGroup() {
  const outerRef = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Group>(null);
  const [clockState, setClockState] = useState(() => {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const rawFill = 1.0 - (m * 60 + s) / 3600;
    return { h, fillLevel: 0.15 + rawFill * 0.85 };
  });

  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;
    const exactSeconds = s + ms / 1000;

    // The clock face rotates around an axis that passes through the
    // highlighted hour rod. This means the hour rod stays roughly stationary
    // while the rest of the face spins around it like a coin flip.
    const hourRodAngle = (h / 12) * Math.PI * 2 - Math.PI / 2;
    const spinAngle = (exactSeconds / 60) * Math.PI * 2;

    if (faceRef.current) {
      // The rod layout uses rotation=[0,0,-angle] then position=[dist,0,0],
      // so the rod's world direction from center is (cos(angle), -sin(angle), 0).
      // The rotation axis must pass through the rod to keep it stationary.
      const axisX = Math.cos(hourRodAngle);
      const axisY = -Math.sin(hourRodAngle);
      const axis = new THREE.Vector3(axisX, axisY, 0).normalize();
      const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, spinAngle);
      faceRef.current.quaternion.copy(quaternion);
    }

    if (outerRef.current) {
      outerRef.current.rotation.set(0, 0, 0);
    }

    // Update rod highlighting and fill level reactively
    const rawFill = 1.0 - (m * 60 + s) / 3600;
    const fill = 0.15 + rawFill * 0.85;
    setClockState(prev => {
      if (prev.h !== h || Math.abs(prev.fillLevel - fill) > 0.01) {
        return { h, fillLevel: fill };
      }
      return prev;
    });
  });

  const { h, fillLevel } = clockState;

  return (
    <group ref={outerRef}>
      <group ref={faceRef}>
        {/* 12 crystal rods — no central sphere */}
        {Array.from({ length: TUBE_COUNT }).map((_, i) => (
          <CrystalRod
            key={i}
            index={i}
            isCurrentHour={i === h}
            fillLevel={i === h ? fillLevel : 0}
          />
        ))}
      </group>

      <Orbs />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} color="#5566aa" />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#6688cc" />
      <pointLight position={[-4, -3, 4]} intensity={0.6} color="#5566aa" />
      <pointLight position={[0, 0, 5]} intensity={1.0} color="#7799cc" />
      <pointLight position={[0, 0, -5]} intensity={0.5} color="#5566aa" />
      {/* Simple env map for glass reflections */}
      <CrystalEnvMap />

      {/* Wormhole tunnel background */}
      <WormholeTunnel />

      {/* Clock in front of tunnel */}
      <ClockGroup />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.3}
        />
      </EffectComposer>
    </>
  );
}

export function CrystalClock() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <color attach="background" args={['#1a0f2e']} />
      <Scene />
    </Canvas>
  );
}
