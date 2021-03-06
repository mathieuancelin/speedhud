import React from 'react';

import { Platform, Animated, Dimensions, Text, View } from 'react-native';

export const SpeedMonitor = React.createClass({
  propTypes: {
    flip: React.PropTypes.bool.isRequired,
    angle: React.PropTypes.number.isRequired,
    mode: React.PropTypes.string.isRequired,
    mock: React.PropTypes.bool.isRequired,
    mockSpeed: React.PropTypes.number.isRequired,
    speedFactor: React.PropTypes.number.isRequired,
    speed: React.PropTypes.number.isRequired,
    textColorWithWarning: React.PropTypes.string.isRequired,
    textColor: React.PropTypes.string.isRequired,
    panResponder: React.PropTypes.object.isRequired,
  },
  cleanupSpeed(s) {
    return s * this.props.speedFactor;
  },
  componentWillMount() {
    this.animatedValue = new Animated.Value(this.props.flip ? -1 : 1);
  },
  componentWillReceiveProps(nextProps) {
    if (this.props.flip !== nextProps.flip) {
      setTimeout(() => {
        // this.animatedValue.setValue(this.props.flip ? -1 : 1);
        Animated.spring(
          this.animatedValue,
          { toValue: nextProps.flip ? -1 : 1 }
        ).start();
      });
    }
  },
  render() {
    const width = Dimensions.get('window').width;
    const predicate = true; // Platform.OS === 'ios';
    const TheView = predicate ? Animated.View : View;
    const scaleX = predicate ? this.animatedValue : (this.props.flip ? -1 : 1);
    return (
      <TheView {...this.props.panResponder.panHandlers} style={{
          paddingTop: 0,
          paddingLeft: 20,
          paddingRight: 20,
          backgroundColor: 'rgba(0,0,0,0)',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: this.props.debug ? 'orange' : null,
          borderWidth: this.props.debug ? 1 : null,
          transform: [{
            scaleX: scaleX
          }, {
            scaleY: 1
          }, {
            perspective: 800
          }, {
            rotateX: `${this.props.angle}deg`
          }] }}>
        <Text style={{
          letterSpacing: 0,
          backgroundColor: 'rgba(0,0,0,0)',
          color: this.props.textColorWithWarning,
          fontWeight: 'bold',
          fontSize: 200,
          writingDirection: 'rtl' }}>
          {this.props.mock ? this.props.mockSpeed : this.cleanupSpeed(this.props.speed).toFixed(0)}
        </Text>
        <Text style={{
          color: this.props.textColor,
          backgroundColor: 'rgba(0,0,0,0)',
          opacity: 0.9,
          fontSize: 80,
          marginLeft: 30 }}>
          {this.props.mode}
        </Text>
      </TheView>
    );
  }
});
