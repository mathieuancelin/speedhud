import React, { PropTypes } from 'react';

import { Dimensions, Text, View } from 'react-native';


export const MessageBar = React.createClass({
  propTypes: {
    error: PropTypes.string,
  },
  render() {
    const width = Dimensions.get('window').width;
    return (
      <View style={{
          width,
          backgroundColor: 'rgba(0,0,0,0)',
          flex: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 40,
          paddingLeft: 25,
          borderColor: this.props.debug ? 'yellow' : null,
          borderWidth: this.props.debug ? 1 : null,
      }}>
        <Text style={{
          color: 'red',
          backgroundColor: 'rgba(0,0,0,0)',
          fontSize: 20,
          width
        }}>
          {this.props.error ? this.props.error.message : ''}
        </Text>
      </View>
    );
  }
});
