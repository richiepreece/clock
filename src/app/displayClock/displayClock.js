/* eslint-disable no-extend-native */
import React, {useState} from 'react';
import Time from '../time/Time';

import sun from './sun.svg';

import './DisplayClock.scss';

const dayjs = Time.dayjs;

export default () => {
  const [clock, setClock] = useState({
    time: '',
    date: '',
    dst: false
  });

  (() => {
    let togo = Time.millisecondsPerSecond - Time.millisecondsThisSecond;

    setTimeout(() => {
      setClock({
        time: dayjs().format('LTS'),
        date: dayjs().format('L'),
        dst: (new Date()).isDstObserved()
      });
    }, togo);
  })();

  return (<div className="display-clock">
    <div className="left">
      {clock.date}
    </div>
    <div className="right">
      <div className="dst">
        {clock.dst && <img src={sun} alt="DST icon" />}
      </div>
      <div className="time">
        {clock.time}
      </div>
    </div>
  </div>);
}

Date.prototype.stdTimezoneOffset = function () {
  var jan = new Date(this.getFullYear(), 0, 1);
  var jul = new Date(this.getFullYear(), 6, 1);
  return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
  return this.getTimezoneOffset() < this.stdTimezoneOffset();
}
