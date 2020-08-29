import React from 'react';

import Bars from './Bars';
import Orbs from './Orbs';

export default (props) => {
  return (
    <mesh
    {...props}
  >
    <Orbs />
    <Bars />
  </mesh>);
}