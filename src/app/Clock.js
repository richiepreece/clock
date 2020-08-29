import React, { useRef } from 'react';
import * as THREE from 'three';

import Bars from './Bars';
import Orbs from './Orbs';

export default (props) => {
  const mesh = useRef();

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <Orbs position={[0, 0, 0]} />
    <Bars position={[0, 0, 0]} />
  </mesh>);
}