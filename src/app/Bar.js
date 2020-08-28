import React, { useRef, useState } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import moment from 'moment';

function BarContainer (props) {
  const [currHour, setCurrHour] = useState(false);
  const [currHeight, setCurrHeight] = useState(1.5);

  const mesh = useRef()
  const mesh2 = useRef()

  const degrees = 360;
  const millisecondsPerMinute = 60 * 1000;
  const millisecondsPerHour = 60 * 60 * 1000;
  const degreesPerMillisecondPerMinute = (degrees / millisecondsPerMinute) * 4;

  const height = 1.5;

  useFrame(() => {
    let millisecondsThisMinute = moment().seconds() * 1000 + moment().milliseconds();
    let rotate = (degreesPerMillisecondPerMinute * millisecondsThisMinute) % 360;

    mesh.current.rotation.y = THREE.MathUtils.degToRad(rotate);
    if(mesh2.current) {
      mesh2.current.rotation.y = THREE.MathUtils.degToRad(rotate);
      let millisecondsThisHour = (moment().minutes() * 60 * 1000 + moment().seconds() * 1000 + moment().milliseconds());
      let missingHeight = height * (millisecondsThisHour / millisecondsPerHour);
      setCurrHeight(height - missingHeight);
    }

    if((!currHour && (moment().hour() % 12) === props.oclock) || (currHour && (moment().hour() % 12) !== props.oclock)) {
      setCurrHour((moment().hour() % 12) === props.oclock);
    }
  });

  return (
    <>
    <mesh
      {...props}
      ref={mesh}
    >
      <cylinderBufferGeometry attach="geometry" args={[0.15, 0.15, 1.5, 6]} />
      <meshPhongMaterial attach="material" color={new THREE.Color('#1e4985')} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} />
    </mesh>
    {currHour &&
    <mesh
      {...props}
      ref={mesh2}
    >
      <cylinderBufferGeometry attach="geometry" args={[0.16, 0.16, currHeight, 6]} />
      <meshPhongMaterial attach="material" color={'white'} roughness={0.1} metalness={0.0} reflectivity={1.0} transparent opacity={0.5} />
    </mesh>
    }
    </>
  )
}

export default (props) => {
  // This reference will give us direct access to the mesh
  const mesh = useRef();

  const hourBaseRotate = 360 / 12 * -props.oclock;

  return (
    <mesh
      {...props}
      ref={mesh}
      rotation={[0, 0, THREE.MathUtils.degToRad(hourBaseRotate)]}
    >
      <BarContainer full={props.full} oclock={props.oclock} />
    </mesh>
  )
}