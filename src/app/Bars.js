import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import moment from 'moment';

import Bar from './Bar';

export default (props) => {
  const mesh = useRef();

  const degrees = 360;
  const millisecondsPerMinute = 60 * 1000;
  const degreesPerMillisecondPerMinute = degrees / millisecondsPerMinute;

  useFrame(() => {
    let millisecondsThisMinute = moment().seconds() * 1000 + moment().milliseconds();
    let degrees = degreesPerMillisecondPerMinute * -millisecondsThisMinute;

    mesh.current.rotation.y = THREE.MathUtils.degToRad(degrees);
  })

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <circleBufferGeometry attach="geometry" args={[3.5, 100]} />
    <meshPhongMaterial attach="material" color={new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} />

    <Bar position={[1, 2, 0]} oclock={1} />
    <Bar position={[2, 1, 0]} oclock={2} />
    <Bar position={[2, 0, 0]} oclock={3} />
    <Bar position={[2, -1, 0]} oclock={4} />
    <Bar position={[1, -2, 0]} oclock={5} />
    <Bar position={[0, -2, 0]} oclock={6} />
    <Bar position={[-1, -2, 0]} oclock={7} />
    <Bar position={[-2, -1, 0]} oclock={8} />
    <Bar position={[-2, 0, 0]} oclock={9} />
    <Bar position={[-2, 1, 0]} oclock={10} />
    <Bar position={[-1, 2, 0]} oclock={11} />
    <Bar position={[0, 2, 0]} oclock={0} />
  </mesh>);
}