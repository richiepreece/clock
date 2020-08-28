import React, { useRef } from 'react';
import * as THREE from 'three';

import Bars from './Bars';

export default (props) => {
  const mesh = useRef();

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <circleBufferGeometry attach="geometry" args={[3.5, 100]} />
    <meshPhongMaterial attach="material" color={new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} />

    <Bars position={[0, 0, 0]} />
  </mesh>);
}