import React from 'react';

import { startTracking, stopTracking, toggleNativeWatch, nativeWatch, subscribe } from './speedwatcher';
import { Toolbar } from './components/Toolbar';
import { Topbar } from './components/Topbar';
import { SpeedMonitor } from './components/SpeedMonitor';
import { MessageBar } from './components/MessageBar';
import * as SpeedStats from './services/httpSpeedStats';

import { PanResponder, View } from 'react-native';

const themes = [
  { color: '#FFFFFF', back: 'black' }, // white
  { color: '#00FFFF', back: 'black' }, // cyan
  { color: '#00DEFF', back: 'black' }, // lightblue
  { color: '#FFFF00', back: 'black' }, // yellow
  { color: '#B1FB17', back: 'black' }, // green yellow
  { color: '#3DFF33', back: 'black' }, // vert
  { color: '#F52887', back: 'black' }, // deep pink
  { color: '#F433FF', back: 'black' }, // rose fushia
  { color: '#F87217', back: 'black' }, // orange
  { color: 'black', back: 'white' },
  { color: 'black', back: 'white' },
];

function cleanupArray(arr) {
  if (arr.length > 600) {
    return [...arr].splice(0, arr.length - 600);
  }
  return arr;
}

export const HUD = React.createClass({
  getInitialState() {
    return {
      debug: false,
      nativeWatch: nativeWatch(),
      mode: 'km/h',
      speedFactor: 1.0,
      moy: 0,
      moyArr: [],
      lastMoy: 0,
      mock: false,
      max: 0,
      mockSpeed: 42,
      screen: 'hud',
      theme: 0,
      angle: 0,
      flip: true,
      speed: 0.0,
      actualSpeed: 0.0,
      error: null,
      coords: {
        latitude: 0.0,
        longitude: 0.0,
        speed: 0.0,
      },
      timestamp: Date.now(),
      gesture: 'none',
    };
  },
  onPanResponderGrant(evt, gestureState) {
    this.setState({ gesture: 'started' });
  },
  onPanResponderMove(evt, gestureState) {
    if (this.state.gesture === 'started') {
      if (Math.abs(gestureState.vx) < 1 && Math.abs(gestureState.dy) > 10) {
        if (gestureState.dy > 0 && this.state.angle > -45) {
          this.setState({ angle: this.state.angle - 1 });
        } else if (gestureState.dy < 0 && this.state.angle < 45) {
          this.setState({ angle: this.state.angle + 1 });
        }
      }
      if (Math.abs(gestureState.vx) > 3.5) {
        if (gestureState.vx > 0) {
          this.setState({ theme: this.state.theme + 1, gesture: 'done' });
        } else {
          this.setState({ theme: this.state.theme - 1, gesture: 'done' });
        }
      }
    }
  },
  onPanResponderRelease(evt, gestureState) {
    this.setState({ gesture: 'none' });
    const { dx, dy, vx, vy } = gestureState;
    if (dx === 0 && dy === 0 && vx === 0 && vy === 0) {
      this.flip();
    }
  },
  cleanupSpeed(s) {
    return s * this.state.speedFactor;
  },
  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: this.onPanResponderGrant,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: this.onPanResponderRelease,
      onPanResponderTerminate: this.onPanResponderTerminate,
      onShouldBlockNativeResponder: () => true,
    });
  },
  componentDidMount() {
    this.unsubscribe = subscribe(e => {
      const { speed, timestamp, error, coords } = e;
      if (error) {
        this.setState({ error });
      } else {
        if (speed > 999) {
          this.setState({ speed: 999.0, actualSpeed: speed, error, timestamp, coords });
        } else if (speed < 0) {
          this.setState({ speed: 0.0, actualSpeed: speed, error, timestamp, coords });
        } else {
          let max = this.state.max;
          if (speed > max) {
            max = speed;
          }
          this.setState({ speed, max, actualSpeed: speed, error, timestamp, coords });
          SpeedStats.push({ position: coords, speed });
        }
      }
      const now = Date.now();
      if (now - this.state.lastMoy > 10000) {
        const moy = this.state.moyArr.length > 0 ?
          this.state.moyArr.reduce((a, b) => a + b) / this.state.moyArr.length :
          0;
        this.setState({ moyArr: cleanupArray([...this.state.moyArr, this.state.speed]), lastMoy: Date.now(), moy: moy < 0 ? 0 : moy });
      }
    });
    startTracking();
    SpeedStats.start();
  },
  componentWillUnmount() {
    this.unsubscribe();
    stopTracking();
    SpeedStats.stop();
  },
  flip() {
    this.setState({ flip: !this.state.flip });
  },
  toggleMode() {
    if (this.state.mode === 'km/h') {
      this.setState({ mode: 'mph', speedFactor: 0.621371 });
    } else if (this.state.mode === 'mph') {
      this.setState({ mode: 'knots', speedFactor: 0.539957 });
    } else {
      this.setState({ mode: 'km/h', speedFactor: 1.0 });
    }
  },
  toggleMock() {
    this.setState({ mock: !this.state.mock });
  },
  toggleWatch() {
    stopTracking();
    SpeedStats.stop();
    toggleNativeWatch();
    this.setState({ nativeWatch: nativeWatch() });
    setTimeout(() => {
      startTracking();
      SpeedStats.start();
    }, 2500);
  },
  render() {
    const index = parseInt((Math.abs(this.state.theme) % (themes.length - 1)).toFixed(0), 10);
    const backColor = themes[index].back;
    const textColor = themes[index].color;
    const textColorWithWarning = this.cleanupSpeed(this.state.speed) > this.cleanupSpeed(133.0) ? 'red' : themes[index].color;
    return (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: backColor }}>
        <Topbar {...this.state} textColor={textColor} />
        <SpeedMonitor {...this.state}
          debug={this.state.debug}
          panResponder={this._panResponder}
          textColor={textColor}
          textColorWithWarning={textColorWithWarning} />
        <Toolbar
          stats={SpeedStats.isRunning()}
          debug={this.state.debug}
          mode={this.state.mode}
          demo={this.state.mock}
          toggleMode={this.toggleMode}
          toggleMock={this.toggleMock}
          toggleWatch={this.toggleWatch}
          nativeWatch={this.state.nativeWatch}
          toggleStats={() => {
            SpeedStats.toggle();
            this.forceUpdate();
          }} />
        <MessageBar debug={this.state.debug} error={this.state.error} />
      </View>
    );
  },
});
