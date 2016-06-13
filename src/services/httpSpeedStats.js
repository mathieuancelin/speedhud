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
  if (!running) {
    running = true;
    sessionId = uuid.v4();
    sendToServer();
    console.log('Start sending stats');
    if (cb) cb();
  }
}

export function stop(cb) {
  sendToServer();
  if (running) {
    running = false;
    clearTimeout(timeoutId);
    timeoutId = null;
    sessionId = null;
    console.log('Stop sending stats');
    if (cb) cb();
  }
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
  return sendToServer();
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
    let valuesToSend = values;
    values = [];
    sending = true;
    return AsyncStorage.getItem('ERROR_REPORTS').then(
      (data) => JSON.parse(data),
      (error) => []
    ).then(reports => {
      valuesToSend = valuesToSend.concat(reports);
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
        return { status: 'DATA_SENT' };
      }, e => {
        console.log(`Error while sending data to the server : ${e.message}`);
        error = true;
        const valuesToStore = values.concat(valuesToSend);
        values = [];
        return AsyncStorage.setItem('ERROR_REPORTS', JSON.stringify(valuesToStore)).then(
          (data) => ({ status: 'SAVED_ERRORS_IN_ASYNCSTORAGE' }),
          (error) => {
            console.log(`error while saving error reports in storage, ${e.message}`);
            values = values.concat(valuesToStore);
            return { status: 'SAVED_ERRORS_IN_MEMORY' };
          }
        ).then(() => {
          timeoutId = setTimeout(sendToServer, sendEvery);
          sending = false;
        });
      });
    });

  } else {
    timeoutId = setTimeout(sendToServer, sendEvery);
    sending = false;
    return new Promise(success => success({ status: 'NOTHING_TO_SEND' }));
  }
}
