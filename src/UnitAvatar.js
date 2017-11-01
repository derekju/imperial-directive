// @flow

import {ELITE_RED, GRAY} from './styles/colors';
import React from 'react';

const styles = {
  avatar: {
    alignItems: 'center',
    border: '2px solid black',
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
  eliteAvatar: {
    border: `2px solid ${ELITE_RED}`,
  },
  name: {
    textAlign: 'center',
  },
};

type UnitAvatarPropsType = {
  elite: boolean,
  firstName: string,
  lastName: string,
};

class UnitAvatar extends React.Component {
  props: UnitAvatarPropsType;

  render() {
    const avatarName = `${this.props.firstName.length ? this.props.firstName[0] : ''}${this.props
      .lastName.length
      ? this.props.lastName[0]
      : ''}`;

    const avatarStyles = Object.assign(
      {},
      styles.avatar,
      this.props.elite ? styles.eliteAvatar : {}
    );

    return (
      <div>
        <div style={avatarStyles}>{avatarName}</div>
        <div style={styles.name}>{this.props.firstName}</div>
      </div>
    );
  }
}

export default UnitAvatar;
