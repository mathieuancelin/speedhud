import { Platform, AsyncStorage } from 'react-native';
import moment from 'moment';
import uuid from 'uuid';

const values = [];
const sendEvery = 60000;
const MAX_VALUES = 5000;

let running = false;
let timeoutId = null;
let sessionId = uuid.v4();
let error = false;
let sending = false;

export function isRunning() {
  return running;
}

export function isError() {
  return error;
}

export function start(cb) {
  running = true;
  sessionId = uuid.v4();
  sendToServer();
  console.log('Start sending stats');
  if (cb) cb();
}

export function stop(cb) {
  sendToServer();
  running = false;
  clearTimeout(timeoutId);
  timeoutId = null;
  sessionId = null;
  console.log('Stop sending stats');
  if (cb) cb();
}

export function toggle(cb) {
  if (running) {
    stop(cb);
  } else {
    start(cb);
  }
}

export function push(data) {
  if (values.length > MAX_VALUES) {
    values.shift();
  }
  values.push(Object.assign({}, data, {
    ctime: Date.now(),
    os: Platform.OS,
  }));
}

export function flush() {
  sendToServer();
}

export function saveIntoAsyncStorage() {
  const valuesToSave = values;
  values = [];
  AsyncStorage.setItem('USER_LAST_REPORTS', JSON.stringify(valuesToSave));
}

function sendToServer() {
  if (!running) return;
  if (sending) return;
  if (values.length > 0) {
    const valuesToSend = values;
    values = [];
    sending = true;
    // TODO : if data into storage, then send it too
    console.log(`Sending ${valuesToSend.length} report now`);
    fetch(`http://api.speedhud.ovh:9000/speed/recording/${sessionId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(valuesToSend)
    }).then(data => {
      error = false;
      timeoutId = setTimeout(sendToServer, sendEvery);
      sending = false;
    }, e => {
      console.log(`Error while sending data to the server : ${e.message}`);
      error = true;
      values = values.concat(valuesToSend);
      timeoutId = setTimeout(sendToServer, sendEvery);
      sending = false;
      // TODO : save into async storage
    });
  } else {
    timeoutId = setTimeout(sendToServer, sendEvery);
    sending = false;
  }
}
