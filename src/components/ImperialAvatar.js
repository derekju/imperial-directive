// @flow

import {ELITE_RED} from '../styles/colors';
import React from 'react';
import imperialPng from '../assets/icons/imperial.png';
import type {ImperialUnitType} from '../reducers/imperials';

const styles = {
  activated: {
    border: '3px solid green',
  },
  avatar: {
    alignItems: 'center',
    border: '3px solid black',
    borderRadius: '42px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '32px',
    height: '80px',
    justifyContent: 'center',
    marginBottom: '10px',
    width: '80px',
  },
  base: {
    marginRight: '20px',
    width: '84px',
  },
  eliteAvatar: {
    border: `3px solid ${ELITE_RED}`,
  },
  name: {
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

type ImperialAvatarPropsType = {
  imperialUnit: ImperialUnitType,
  setImperialGroupActivated: Function,
};

class ImperialAvatar extends React.Component<ImperialAvatarPropsType> {

  static defaultProps = {
    setImperialGroupActivated: () => {},
  };

  handleClick = () => {
    if (this.props.activated) {
      return;
    }

    this.props.setImperialGroupActivated(this.props.imperialUnit);
  };

  render() {
    const avatarStyles = Object.assign(
      {},
      styles.avatar,
      this.props.elite ? styles.eliteAvatar : {},
      this.props.activated ? styles.activated : {}
    );

    return (
      <div style={styles.base} onClick={this.handleClick}>
        <div style={avatarStyles}>
          <img src={imperialPng} style={{width: '70%', height: '70%'}} />
        </div>
        <div style={styles.name}>{this.props.imperialUnit.name}</div>
      </div>
    );
  }
}

export default ImperialAvatar;
