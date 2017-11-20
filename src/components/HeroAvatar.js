// @flow

import React from 'react';
import rebelPng from '../assets/icons/rebel.png';

const styles = {
  avatar: {
    alignItems: 'center',
    border: '3px solid black',
    borderRadius: '42px',
    display: 'flex',
    fontSize: '32px',
    height: '80px',
    justifyContent: 'center',
    marginBottom: '10px',
    width: '80px',
  },
  base: {
    width: '86px',
  },
  image: {
    height: '60%',
    width: '60%',
  },
  name: {
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

type HeroAvatarPropsType = {
  firstName: string,
  style?: Object,
};

class HeroAvatar extends React.Component<HeroAvatarPropsType> {
  render() {
    const combinedStyles = {
      ...styles.avatar,
      ...(this.props.style || {}),
    };

    return (
      <div style={styles.base}>
        <div style={combinedStyles}>
          <img alt={this.props.firstName} src={rebelPng} style={styles.image} />
        </div>
        <div style={styles.name}>{this.props.firstName}</div>
      </div>
    );
  }
}

export default HeroAvatar;
