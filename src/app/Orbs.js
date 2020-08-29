import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import Orb from './Orb';

import Time from './time/Time';

export default (props) => {
  const mesh = useRef();

  const degrees = 360;
  const degreesPerMillisecondPerMinute = degrees / Time.millisecondsPerMinute;

  useFrame(() => {
    let degrees = degreesPerMillisecondPerMinute * -Time.millisecondsThisMinute;

    mesh.current.rotation.y = THREE.MathUtils.degToRad(degrees);
  })

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <sphereBufferGeometry attach="geometry" args={[1, 30, 30]} />
    <meshPhongMaterial attach="material" color={new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} />

    <Orb position={[0, 0, 0]} />
  </mesh>);
}