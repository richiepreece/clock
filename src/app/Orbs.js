import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import Orb from './Orb';

import Time from './time/Time';

export default (props) => {
  const mesh = useRef();

  useFrame(() => {
    // Spinning orb pattern will repeat, just spun by 30 degrees every hour
    const baseHourRotation = 30 * Time.zeroBasedHour;
    const currHourProgressRotation = (30 / Time.millisecondsPerHour) * Time.millisecondsThisHour;
    mesh.current.rotation.y = THREE.MathUtils.degToRad(baseHourRotation + currHourProgressRotation);
  })

  return (
    <mesh
    {...props}
    ref={mesh}
    rotation={[-Math.PI / 2, 0, 0]}
  >
    {/* Placeholder to show progress through hour */}
    <cylinderBufferGeometry attach="geometry" args={[.5, .5, .01, 3]} />
    <meshPhysicalMaterial
        attach="material"
        color={new THREE.Color('#1e4985')}
        roughness={0.1}
        metalness={0.0}
        reflectivity={1.0}
        transparent
        opacity={0.5}
        refractionRatio={0.9}
        clearcoat
        transmission={0.4} />

    <Orb position={[0, 0, 0]} />
  </mesh>);
}