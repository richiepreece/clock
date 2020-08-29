import React from 'react';

import Tunnel from './Tunnel';
import Orbs from './Orbs';
import Bars from './Bars';

export default (props) => {
  return (
    <mesh
    {...props}
  >
    <Tunnel />
    <Orbs />
    <Bars />
  </mesh>);
}