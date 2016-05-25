import React from 'react';
import { AppRegistry } from 'react-native';
import { HUD } from './src/hud';

const Speedhud = React.createClass({
  render: function() {
    return (
      <HUD />
    );
  }
});

AppRegistry.registerComponent('speedhud', () => Speedhud);
