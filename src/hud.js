import React from 'react';

import {
  startTracking,
  stopTracking,
  toggleNativeWatch,
  nativeWatch,
  subscribe } from './speedwatcher';
import { Toolbar } from './components/Toolbar';
import { Topbar } from './components/Topbar';
import { SpeedMonitor } from './components/SpeedMonitor';
import { MessageBar } from './components/MessageBar';
import { Average } from './tools/average';
import * as SpeedStats from './services/httpSpeedStats';

import { AsyncStorage, AppState, NetInfo, PanResponder, View } from 'react-native';

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

export const HUD = React.createClass({
  getInitialState() {
    return {
      connected: false,
      debug: false,
      nativeWatch: nativeWatch(),
      mode: 'km/h',
      speedFactor: 1.0,
      moy: new Average(),
      // moy: 0,
      // moyArr: [],
      // lastMoy: 0,
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
        if (gestureState.dy > 0 && this.state.angle > - 45) {
          this.setState({ angle: this.state.angle - 2 });
        } else if (gestureState.dy < 0 && this.state.angle < 45) {
          this.setState({ angle: this.state.angle + 2 });
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
    if (dx < 2 && dy < 2 && vx < 2 && vy < 2) {
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
  netInfoReachChanged(reach) {
    if (reach !== null) {
      this.updateConnected();
      if (reach === 'none' || reach === 'NONE') {
        console.log('App lost data connectivity');
      } else {
        console.log(`App reached data connectivity ${reach}`);
        if (SpeedStats.isRunning()) {
          SpeedStats.flush();
        }
      }
    }
  },
  appStateChanged(state) {
    if (state !== null) {
      if (state === 'active') {
        this.unIdleApp();
        console.log(`App is now active : ${state}`);
      } else {
        this.idleApp();
        console.log(`App is now inactive : ${state}`);
      }
    }
  },
  rehydrateFromAsyncStorage() {
    console.log('reading USER_PREFERENCES');
    AsyncStorage.getItem('USER_PREFERENCES').then(doc => {
      if (doc !== null) {
        console.log(`USER_PREFERENCES are ${doc}`);
        this.setState(JSON.parse(doc));
      }
    });
  },
  saveIntoAsyncStorage() {
    console.log('Saving user preferences');
    AsyncStorage.setItem('USER_PREFERENCES', JSON.stringify({
      flip: this.state.flip,
      mode: this.state.mode,
      theme: this.state.theme,
    }));
  },
  componentDidMount() {
    NetInfo.addEventListener('change', this.netInfoReachChanged);
    AppState.addEventListener('change', this.appStateChanged);
    this.rehydrateFromAsyncStorage();
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
          if (speed > 3.0) {
            SpeedStats.push({ pos: coords, speed });
          }
        }
      }
      const now = Date.now();
      // TODO : fix average
      // if (speed > 3.0 && ((now - this.state.lastMoy) > 5000)) {
      if (speed > 4.9 && ((now - this.state.moy.lastCall()) > 5000)) {
        this.setState({ moy: this.state.moy.push(speed) });
        // const moy = this.state.moyArr.length > 0 ?
        //  this.state.moyArr.reduce((a, b) => a + b) / this.state.moyArr.length :
        //  0;
        // this.setState({ moyArr: cleanupArray([...this.state.moyArr, this.state.speed]), lastMoy: Date.now(), moy: moy < 0 ? 0 : moy });
      }
    });
    this.unIdleApp();
  },
  unIdleApp() {
    console.log('unIdle App')
    this.rehydrateFromAsyncStorage();
    this.updateConnected();
    startTracking();
    AsyncStorage.getItem('USER_ACCEPTS_STATS_SENDING_11062016').then(doc => {
      if (doc === null) {
        console.log('first run, user will send data');
        AsyncStorage.setItem('USER_ACCEPTS_STATS_SENDING_11062016', JSON.stringify({ value: true }))
        SpeedStats.start();
      } else {
        console.log(`user_send_stats from AsyncStorage ${doc}`);
        const value = JSON.parse(doc).value;
        if (value && !SpeedStats.isRunning()) {
          SpeedStats.start();
          SpeedStats.flush();
        }
        if (!value && SpeedStats.isRunning()) {
          SpeedStats.flush();
          SpeedStats.stop();
        }
      }
    });
  },
  updateConnected() {
    NetInfo.isConnected.fetch().then(connected => {
      console.log(`App is ${connected ? 'connected' : 'not connected'}`);
      this.setState({ connected });
    });
  },
  idleApp() {
    console.log('Idle App, stopping everything');
    // TODO : ask httpService to save data into storage
    this.saveIntoAsyncStorage();
    if (SpeedStats.isRunning()) {
      SpeedStats.flush();
    }
    stopTracking();
    SpeedStats.stop();
  },
  componentWillUnmount() {
    this.idleApp();
    this.unsubscribe();
    this.saveIntoAsyncStorage();
    NetInfo.removeEventListener('change', this.netInfoReachChanged);
    AppState.removeEventListener('change', this.appStateChanged);
    console.log('component will unmount, app is killed I guess')
  },
  flip() {
    this.setState({ flip: !this.state.flip });
  },
  toggleStats() {
    if (SpeedStats.isRunning()) {
      AsyncStorage.setItem('USER_ACCEPTS_STATS_SENDING_11062016', JSON.stringify({ value: false }));
      SpeedStats.pingStatsToggleOff();
    } else {
      AsyncStorage.setItem('USER_ACCEPTS_STATS_SENDING_11062016', JSON.stringify({ value: true }));
      SpeedStats.pingStatsToggleOn();
    }
    SpeedStats.toggle(() => this.forceUpdate());
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
          connected={!!this.state.connected}
          stats={SpeedStats.isRunning()}
          sendError={SpeedStats.isError()}
          debug={this.state.debug}
          mode={this.state.mode}
          demo={this.state.mock}
          toggleMode={this.toggleMode}
          toggleMock={this.toggleMock}
          toggleWatch={this.toggleWatch}
          nativeWatch={this.state.nativeWatch}
          toggleStats={this.toggleStats} />
        <MessageBar debug={this.state.debug} error={this.state.error ? (this.state.error.message || this.state.error) : ''} />
      </View>
    );
  },
});
