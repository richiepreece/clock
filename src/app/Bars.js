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
    let rotateDegrees = degreesPerMillisecondPerMinute * -millisecondsThisMinute;

    mesh.current.rotation.y = THREE.MathUtils.degToRad(rotateDegrees);
  });

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    {/* <circleBufferGeometry attach="geometry" args={[3.5, 100]} />
    <meshPhongMaterial attach="material" color={new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} /> */}

    <Bar oclock={0} />
    <Bar oclock={1} />
    <Bar oclock={2} />
    <Bar oclock={3} />
    <Bar oclock={4} />
    <Bar oclock={5} />
    <Bar oclock={6} />
    <Bar oclock={7} />
    <Bar oclock={8} />
    <Bar oclock={9} />
    <Bar oclock={10} />
    <Bar oclock={11} />
  </mesh>);
}