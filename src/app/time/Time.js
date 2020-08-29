import moment from 'moment';

class Time {
  get millisecondsPerSecond() {
    return 1000;
  }

  get millisecondsPerMinute() {
    return this.millisecondsPerSecond * 60;
  }

  get millisecondsPerHour() {
    return this.millisecondsPerMinute * 60;
  }

  get millisecondsThisSecond() {
    return moment().milliseconds();
  }

  get millisecondsThisMinute() {
    return moment().seconds() * 1000 + this.millisecondsThisSecond;
  }

  get millisecondsThisHour() {
    return moment().minutes() * 60 * 1000 + this.millisecondsThisMinute;
  }

  get zeroBasedHour() {
    return moment().hour() % 12;
  }
}

export default new Time();