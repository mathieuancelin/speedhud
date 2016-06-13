import React from 'react';

import { Animated, Dimensions, Image, StyleSheet, Platform, Text, View, TouchableWithoutFeedback } from 'react-native';

export const Topbar = React.createClass({
  propTypes: {
    flip: React.PropTypes.bool.isRequired,
    mock: React.PropTypes.bool.isRequired,
    mockSpeed: React.PropTypes.number.isRequired,
    max: React.PropTypes.number.isRequired,
    moy: React.PropTypes.object.isRequired,
    speedFactor: React.PropTypes.number.isRequired,
    mode: React.PropTypes.string.isRequired,
    textColor: React.PropTypes.string.isRequired,
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
    const minutes = new Date().getMinutes();
    const hours = new Date().getHours();
    const date = (hours < 10 ? `0${hours}` : hours)+ ':' + (minutes < 10 ? `0${minutes}` : minutes);
    return (
      <Animated.View style={{
          width,
          flex: 0,
          flexDirection: 'row',
          alignItems: 'stretch',
          alignSelf: 'flex-end',
          height: 70,
          paddingLeft: 15,
          paddingRight: 15,
          borderColor: this.props.debug ? 'blue' : null,
          borderWidth: this.props.debug ? 1 : null,
          transform: [{
            scaleX: Platform.OS === 'ios' ? this.animatedValue : (this.props.flip ? -1 : 1)
          }, {
            scaleY: 1
          }] }}>
        <View style={{ flex: 1, flexDirection: 'row', width: width - 150 }}>
          <Text style={{ color: this.props.textColor, fontSize: 30, paddingTop: 7, opacity: 0.9 }}>max</Text>
          <Text style={{ color: this.props.textColor, fontSize: 30, paddingTop: 12, opacity: 0.9 }}>/</Text>
          <Text style={{ color: this.props.textColor, fontSize: 30, paddingTop: 17, opacity: 0.9 }}>avg </Text>
          <View style={{ width: 20 }}></View>
          <Text style={{ color: this.props.textColor, fontSize: 50, paddingTop: 0 }}>
            {this.props.mock ? this.props.mockSpeed : this.cleanupSpeed(this.props.max).toFixed(0)}
          </Text>
          <Text style={{ color: this.props.textColor, fontSize: 30, paddingTop: 14, opacity: 0.9 }}> / </Text>
          <Text style={{ color: this.props.textColor, fontSize: 50, paddingTop: 7 }}>
            {this.props.mock ? this.props.mockSpeed : this.cleanupSpeed(this.props.moy.value()).toFixed(0)}
          </Text>
          <Text style={{ color: this.props.textColor, fontSize: 17, paddingTop: 22, opacity: 0.9 }}> {this.props.mode}</Text>
        </View>
        <Text style={{ color: this.props.textColor, fontSize: 50 }}>{date}</Text>
      </Animated.View>
    );
  }
});
