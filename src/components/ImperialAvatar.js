// @flow

import {ELITE_RED, LIGHT_WHITE, IMPERIAL_BLUE} from '../styles/colors';
import Arrow from 'react-svg-arrow';
import Button from './Button';
import imperialPng from '../assets/icons/imperial.png';
import type {ImperialUnitType} from '../reducers/imperials';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';

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
    marginRight: '20px',
    position: 'relative',
    width: '86px',
  },
  eliteAvatar: {
    border: `3px solid ${ELITE_RED}`,
  },
  exhausted: {
    border: '3px solid green',
    opacity: 0.4,
  },
  image: {
    height: '70%',
    width: '70%',
  },
  name: {
    fontSize: '13px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  numInGroup: {
    ...positionAbsolute(0, 0, null, null),
    backgroundColor: ELITE_RED,
    borderRadius: '14px',
    color: 'white',
    fontSize: '12px',
    height: '14px',
    padding: 5,
    textAlign: 'center',
    width: '14px',
  },
  outer: {
    cursor: 'pointer',
    position: 'relative',
  },
  popup: {
    ...positionAbsolute(-48, null, null, 100),
    alignItems: 'center',
    backgroundColor: LIGHT_WHITE,
    border: '2px solid black',
    display: 'flex',
    flexDirection: 'column',
    height: '175px',
    justifyContent: 'space-between',
    width: '175px',
    zIndex: 1,
  },
  popupAccent: {
    backgroundColor: IMPERIAL_BLUE,
    height: '5px',
    width: '100%',
  },
  popupArrow: {
    ...positionAbsolute(76, null, null, -11),
  },
};

type ImperialAvatarPropsType = {
  defeatImperialFigure: Function,
  exhausted: boolean,
  imperialUnit: ImperialUnitType,
  isImperialPlayerTurn: boolean,
  setImperialGroupActivated: Function,
};

type ImperialAvatarStateType = {
  displayPopup: boolean,
};

class ImperialAvatar extends React.Component<ImperialAvatarPropsType, ImperialAvatarStateType> {
  static defaultProps = {
    setImperialGroupActivated: () => {},
  };

  state = {
    displayPopup: false,
  };

  togglePopup() {
    this.setState((state: ImperialAvatarStateType) => ({displayPopup: !state.displayPopup}));
  }

  handleClick = () => {
    if (!this.props.isImperialPlayerTurn) {
      this.togglePopup();
    }
  };

  handleEndActivation = () => {
    this.props.setImperialGroupActivated(this.props.imperialUnit);
    this.togglePopup();
  };

  handleDefeatImperialFigure = () => {
    this.props.defeatImperialFigure(this.props.imperialUnit);
    this.togglePopup();
  };

  renderPopup() {
    return (
      <div style={styles.popup}>
        <div style={styles.popupArrow}>
          <Arrow
            size={8}
            color={LIGHT_WHITE}
            direction="left"
            borderWidth={2}
            borderColor="black"
          />
        </div>
        <div style={styles.popupAccent} />
        <Button text="Defeat figure" onClick={this.handleDefeatImperialFigure} />
        <Button text="Force activate" />
        <Button text="Info" />
        <div style={styles.popupAccent} />
      </div>
    );
  }

  render() {
    const avatarStyles = Object.assign(
      {},
      styles.avatar,
      this.props.elite ? styles.eliteAvatar : {},
      this.props.exhausted ? styles.exhausted : {}
    );

    return (
      <div style={styles.outer}>
        <div style={styles.base} onClick={this.handleClick}>
          <div style={avatarStyles}>
            <img alt={this.props.imperialUnit.name} src={imperialPng} style={styles.image} />
          </div>
          <div style={styles.name}>{`${this.props.imperialUnit.name} G${
            this.props.imperialUnit.groupNumber
          }`}</div>
          <div style={styles.numInGroup}>{this.props.imperialUnit.currentNumFigures}</div>
        </div>
        {this.state.displayPopup ? this.renderPopup() : null}
      </div>
    );
  }
}

export default ImperialAvatar;
