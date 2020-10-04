import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat)

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
    return dayjs().millisecond();
  }

  get millisecondsThisMinute() {
    return dayjs().second() * 1000 + this.millisecondsThisSecond;
  }

  get millisecondsThisHour() {
    return dayjs().minute() * 60 * 1000 + this.millisecondsThisMinute;
  }

  get zeroBasedHour() {
    return dayjs().hour() % 12;
  }

  get dayjs () {
    return dayjs;
  }
}

export default new Time();