export class Average {
  constructor(total = 0.0, hits = 0) {
    this.total = total;
    this.hits = hits;
    this.callTime = Date.now();
    this.value = this.value.bind(this);
    this.push = this.push.bind(this);
  }
  value() {
    let avg = this.total / this.hits;
    avg = avg < 0 ? 0 : avg;
    avg = isNaN(avg) ? 0 : avg;
    return avg;
  }
  lastCall() {
    return this.callTime;
  }
  push(val) {
    if (val > 2.0) {
      return new Average(this.total + val, this.hits + 1);
    }
    return this;
  }
}
