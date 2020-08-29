import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';

import Bar from './Bar';
import Time from './time/Time';

function BarsContainer(props) {
  const mesh = useRef();
  const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const degreesPerMillisecondPerMinute = 360 / Time.millisecondsPerMinute;

  useFrame(() => {
    // We want the entire clock to rotate round its axis once per minute.
    // This will rotates the correct number of degrees for the number of
    // milliseconds so far this hour
    const rotateDegrees = degreesPerMillisecondPerMinute * -Time.millisecondsThisMinute;
    mesh.current.rotation.y = THREE.MathUtils.degToRad(rotateDegrees);
  });

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    {/* One crystal per hour. Only hour 0 keeps track of time */}
    {hours.map(hour => <Bar key={hour} oclock={hour} time={hour === 0} />)}
  </mesh>);
}

export default props => {
  const mesh = useRef();

  useFrame(() => {
    // Rotate the clock 30 degrees per hour to point the timekeeping
    // crystal towards the current hour
    const hourBaseRotate = 30 * -Time.zeroBasedHour;
    mesh.current.rotation.z = THREE.MathUtils.degToRad(hourBaseRotate);
  });

  return (
    <mesh
    {...props}
    ref={mesh}
  >
    <BarsContainer />
  </mesh>);
}