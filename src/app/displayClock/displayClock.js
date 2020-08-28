import React, {useState} from 'react';
import moment from 'moment';

export default props => {
  let [time, setTime] = useState();

  setInterval(() => {
    setTime(moment().format());
  }, 100);

  return <div>{time}</div>;
}