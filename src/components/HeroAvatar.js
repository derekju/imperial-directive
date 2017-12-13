// @flow

import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import rebelPng from '../assets/icons/rebel.png';

const styles = {
  avatar: {
    alignItems: 'center',
    backgroundColor: 'white',
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
    position: 'relative',
    width: '86px',
  },
  hpBoost: {
    ...positionAbsolute(62, 0, null, null),
    backgroundColor: 'black',
    borderRadius: '14px',
    color: 'white',
    display: 'flex',
    fontSize: '12px',
    minWidth: '14px',
    padding: '5px',
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
  plus: {
    fontSize: '10px',
  },
};

type HeroAvatarPropsType = {
  firstName: string,
  hpBoost: number,
  style?: Object,
};

class HeroAvatar extends React.Component<HeroAvatarPropsType> {
  static defaultProps = {
    hpBoost: 0,
  };

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
        {Boolean(this.props.hpBoost) ? (
          <div style={styles.hpBoost}>
            <span style={styles.plus}>+</span>
            {this.props.hpBoost}
          </div>
        ) : null}
      </div>
    );
  }
}

export default HeroAvatar;
