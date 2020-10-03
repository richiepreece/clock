import React, {useState} from 'react';
import dayjs from 'dayjs';

export default props => {
  let [time, setTime] = useState();

  setInterval(() => {
    setTime(dayjs().format());
  }, 100);

  return <div>{time}</div>;
}