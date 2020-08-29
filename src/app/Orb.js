import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import moment from 'moment';

export default (props) => {
  const mesh = useRef();

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <pointLight {...props} />
  </mesh>);
}