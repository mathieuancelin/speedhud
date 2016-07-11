const listeners = [];
let lastPosition;
let lastTime;
let watchId;
let inspectorId;
let watching = false;
let useNativeWatch = false;

function calculateSpeed(t1, lt1, lng1, t2, lt2, lng2) {
  // From Caspar Kleijne's answer starts
  /** Converts numeric degrees to radians */
  if (typeof(Number.prototype.toRad) === 'undefined') {
    Number.prototype.toRad = function toRadian() { // eslint-disable-line
      return this * Math.PI / 180;
    };
  }
  // From Caspar Kleijne's answer ends
  // From cletus' answer starts
  const R = 6371000; // metres
  const dLat = (lt2 - lt1).toRad();
  const dLon = (lng2 - lng1).toRad();
  const lat1 = lt1.toRad();
  const lat2 = lt2.toRad();

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // in meters
  const duration = t2 - t1; // in seconds
  const speedMPS = distance / duration;
  const speed = speedMPS * 3.6;
  return speed;
}

function getSpeed(nextPos, lastPos, lastTime) {
  const time = Date.now();
  const nativeSpeed = nextPos.coords.speed ? (nextPos.coords.speed * 3.6) : null;
  if (!lastPos || !lastPos.coords || !lastTime) {
    return 0.0;
  }
  if (!nextPos || !nextPos.coords) {
    return 0.0;
  }
  const speed = nativeSpeed || calculateSpeed(
    lastTime / 1000,
    lastPos.coords.latitude,
    lastPos.coords.longitude,
    time / 1000,
    nextPos.coords.latitude,
    nextPos.coords.longitude
  );
  return speed;
}

function fetchAndDispatchPosition() {
  return new Promise((success, failure) => {
    navigator.geolocation.getCurrentPosition(pos => {
      const speed = getSpeed(pos, lastPosition, lastTime);
      listeners.forEach(listener => listener({
        timestamp: pos.timestamp,
        coords: pos.coords,
        error: null,
        speed,
      }));
      lastTime = Date.now();
      lastPosition = pos;
      success({ pos, speed });
    }, error => {
      listeners.forEach(listener => listener({ error }));
      failure(error);
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 1000,
    });
  });
}

function nativeWatchPosition() {
  watchId = navigator.geolocation.watchPosition(pos => {
    const speed = getSpeed(pos, lastPosition, lastTime); // pos.coords.speed ? (pos.coords.speed * 3.6) : 0.0;
    listeners.forEach(listener => listener({
      timestamp: pos.timestamp,
      coords: pos.coords,
      error: null,
      speed,
    }));
    lastTime = Date.now();
    lastPosition = pos;
  }, error => {
    listeners.forEach(listener => listener({ error }));
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 1000,
  });
}

function inspector() {
  if ((lastTime + 2000) < Date.now()) {
    console.log('Inspector had to kick in ...');
    fetchAndDispatchPosition().then(() => {
      inspectorId = setTimeout(inspector, 2000);
    }, () => {
      inspectorId = setTimeout(inspector, 2000);
    });
  }
}

export function startTracking() {
  console.log('Start tracking user position');
  watching = true;
  // useNativeWatch ? nativeWatchPosition() : fakeWatchPosition();
  nativeWatchPosition();
  inspector();
}

export function toggleNativeWatch() {
  useNativeWatch = !useNativeWatch;
}

export function nativeWatch() {
  return useNativeWatch;
}

export function stopTracking() {
  console.log('Stop tracking user position');
  watching = false;
  navigator.geolocation.clearWatch(watchId);
  clearTimeout(inspectorId);
}

export function position() {
  return lastPosition || { coords: {} };
}

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}


/*
function fakeWatchPosition() {
  function fetchPos() {
    if (!watching) return;
    navigator.geolocation.getCurrentPosition(pos => {
      // console.log('emulated watch');
      const speed = getSpeed(pos, lastPosition, lastTime); // pos.coords.speed ? (pos.coords.speed * 3.6) : 0.0;
      listeners.forEach(listener => listener({
        timestamp: pos.timestamp,
        coords: pos.coords,
        error: null,
        speed,
      }));
      lastTime = Date.now();
      lastPosition = pos;
      setTimeout(fetchPos, 2000);
    }, error => {
      listeners.forEach(listener => listener({ error }));
      setTimeout(fetchPos, 2000);
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 1000,
    });
  }
  fetchPos();
}
*/
