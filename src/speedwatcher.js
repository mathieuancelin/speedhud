const listeners = [];
let lastPosition;
let lastTime;
let watchId;
let watching = false;
let useNativeWatch = false;

function nativeWatchPosition() {
  watchId = navigator.geolocation.watchPosition(pos => {
    // console.log('native watch');
    const speed = pos.coords.speed ? (pos.coords.speed * 3.6) : 0.0;
    listeners.forEach(listener => listener({
      timestamp: pos.timestamp,
      coords: pos.coords,
      error: null,
      speed,
    }));
  }, error => {
    listeners.forEach(listener => listener({ error }));
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 1000,
  });
}

function fakeWatchPosition() {
  function fetchPos() {
    if (!watching) return;
    navigator.geolocation.getCurrentPosition(pos => {
      // console.log('emulated watch');
      const speed = pos.coords.speed ? (pos.coords.speed * 3.6) : 0.0;
      listeners.forEach(listener => listener({
        timestamp: pos.timestamp,
        coords: pos.coords,
        error: null,
        speed,
      }));
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

export function startTracking() {
  console.log('Start tracking user position');
  watching = true;
  useNativeWatch ? nativeWatchPosition() : fakeWatchPosition();
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
