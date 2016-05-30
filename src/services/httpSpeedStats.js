import { Platform } from 'react-native';
import moment from 'moment';
import uuid from 'uuid';

const values = [];
const sendEvery = 60000;
const MAX_VALUES = 50000;

let running = true;
let timeoutId = null;
let sessionId = null;

export function isRunning() {
  return running;
}

export function start() {
  running = true;
  sessionId = uuid.v4();
  sendToServer();
}

export function stop() {
  sendToServer();
  running = false;
  clearTimeout(timeoutId);
  timeoutId = null;
  sessionId = null;
}

export function toggle() {
  if (running) {
    stop();
  } else {
    start();
  }
}

export function push(data) {
  if (values.length > MAX_VALUES) {
    values.shift();
  }
  values.push(Object.assign({}, data, {
    clientTime: Date.now(),
    clientDate: moment().format('DD-MM-YYYY_hh:mm:ss:SSS'),
    OS: Platform.OS,
  }));
}

function sendToServer() {
  if (!running) return;
  if (values.length > 0) {
    const valuesToSend = values;
    values = [];
    fetch(`/speedrecording/${sessionId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valuesToSend)
    }).then(data => {
      timeoutId = setTimeout(sendToServer, sendEvery);
    }, error => {
      values = values.concat(valuesToSend);
      timeoutId = setTimeout(sendToServer, sendEvery);
    });
  } else {
    timeoutId = setTimeout(sendToServer, sendEvery);
  }
}

// TODO : bucket class
// TODO : push to server with resilience
