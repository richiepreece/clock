import React, { useRef, useState } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';

import Time from './time/Time';

function Bar (props) {
  const [currHeight, setCurrHeight] = useState(1.5);

  const mesh = useRef()
  const mesh2 = useRef()

  // Bars should rotate once very 15 seconds
  const degreesPerMillisecondPerMinute = (360 / Time.millisecondsPerMinute) * 4;
  const height = 1.5;

  useFrame(() => {
    let rotate = (degreesPerMillisecondPerMinute * Time.millisecondsThisMinute) % 360;
    mesh.current.rotation.y = THREE.MathUtils.degToRad(rotate);

    if(props.time) {
      mesh2.current.rotation.y = THREE.MathUtils.degToRad(rotate);
      let missingHeight = (height - 0.02) * (Time.millisecondsThisHour / Time.millisecondsPerHour);

      let intendedHeight = height - missingHeight - 0.02;
      if(currHeight < intendedHeight) {
        setCurrHeight(currHeight + 0.01);
      } else {
        setCurrHeight(height - missingHeight - 0.02);
      }
    }
  });

  return (
    <>
    <mesh
      {...props}
      ref={mesh}
      position={[0, 2, 0]}
    >
      <cylinderBufferGeometry attach="geometry" args={[0.15, 0.15, 1.5, 6]} />
      <meshPhongMaterial attach="material" color={props.time ? new THREE.Color('#6096ff') : new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} refractionRatio={0.7} />
    </mesh>
    {props.time &&
      <mesh
        {...props}
        position={[0, 2 + ((currHeight - 1.5) / 2) + 0.01, 0]}
        ref={mesh2}
      >
        <cylinderBufferGeometry attach="geometry" args={[0.149, 0.149, currHeight, 6]} />
        <meshPhongMaterial attach="material" color={new THREE.Color('#94f4fe')} />
      </mesh>
    }
    </>
  )
}

export default (props) => {
  const hourBaseRotate = 30 * -props.oclock;

  return (
    // Start each mesh off rotated 30 degrees from center to give all
    // 12 hours a new y-axis direction for easier rotation
    <mesh
      {...props}
      rotation={[0, 0, THREE.MathUtils.degToRad(hourBaseRotate)]}
    >
      <Bar {...props} />
    </mesh>
  )
}