import React, { useRef } from 'react';

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