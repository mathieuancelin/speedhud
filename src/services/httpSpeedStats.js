const values = [];

let running = true;

export function isRunning() {
  return running;
}

export function start() {
  running = true;
}

export function stop() {
  running = false;
}

export function toggle() {
  running = !running;
}

export function push(data) {
  
}
