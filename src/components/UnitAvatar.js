// @flow

import {ELITE_RED, GRAY} from '../styles/colors';
import React from 'react';

const styles = {
  activated: {
    border: '3px solid green',
  },
  avatar: {
    alignItems: 'center',
    border: '3px solid black',
    borderRadius: '42px',
    cursor: 'pointer',
    color: GRAY,
    display: 'flex',
    fontSize: '32px',
    height: '80px',
    justifyContent: 'center',
    marginBottom: '10px',
    width: '80px',
  },
  base: {
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

type UnitAvatarPropsType = {
  activated: boolean,
  displayFullName: boolean,
  elite: boolean,
  firstName: string,
  id: string,
  lastName: string,
  setRebelHeroActivated: Function,
  style?: Object,
};

class UnitAvatar extends React.Component<UnitAvatarPropsType> {
  handleClick = () => {
    if (this.props.activated) {
      return;
    }

    this.props.setRebelHeroActivated(this.props.id);
  };

  render() {
    const avatarName = `${this.props.firstName.length ? this.props.firstName[0] : ''}${this.props
      .lastName.length
      ? this.props.lastName[0]
      : ''}`;

    const avatarStyles = Object.assign(
      {},
      styles.avatar,
      this.props.elite ? styles.eliteAvatar : {},
      this.props.activated ? styles.activated : {},
    );

    const nameToDisplay = `${this.props.firstName} ${this.props.displayFullName
      ? this.props.lastName
      : ''}`;

    return (
      <div style={{...styles.base, ...(this.props.style || {})}} onClick={this.handleClick}>
        <div style={avatarStyles}>{avatarName}</div>
        <div style={styles.name}>{nameToDisplay}</div>
      </div>
    );
  }
}

export default UnitAvatar;
