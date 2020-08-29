import React, {useRef} from 'react';
import {useFrame} from 'react-three-fiber';
import * as THREE from 'three';

export default props => {
  var WaterTexture = new THREE.TextureLoader().load( "textures/water.jpg" );

  return (
    <mesh
      {...props}
      rotation={[Math.PI / 2, 0, 0]}
    >
      {/* TODO */}
    </mesh>
  )
}