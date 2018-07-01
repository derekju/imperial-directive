// @flow

import {ELITE_RED, LIGHT_WHITE, REBEL_RED, SUCCESS_GREEN} from '../styles/colors';
import Arrow from 'react-svg-arrow';
import Button from './Button';
import HeroAvatar from './HeroAvatar';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';

const styles = {
  activated: {
    border: `3px solid ${SUCCESS_GREEN}`,
    opacity: 0.4,
  },
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
  eliteAvatar: {
    border: `3px solid ${ELITE_RED}`,
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
  outer: {
    cursor: 'pointer',
  },
  popup: {
    ...positionAbsolute(-47, null, null, 122),
    alignItems: 'center',
    backgroundColor: LIGHT_WHITE,
    border: '2px solid black',
    display: 'flex',
    flexDirection: 'column',
    height: '175px',
    justifyContent: 'space-between',
    width: '175px',
    zIndex: 101, // Needs to be higher than the AI card
  },
  popupAccent: {
    backgroundColor: REBEL_RED,
    height: '5px',
    width: '100%',
  },
  popupArrow: {
    ...positionAbsolute(72, null, null, -11),
  },
  popupMask: {
    ...positionAbsolute(75, null, null, -1),
    backgroundColor: LIGHT_WHITE,
    height: '16px',
    width: '2px',
  },
  withdrawn: {
    backgroundColor: 'black',
    opacity: 0.25,
  },
  wounded: {
    backgroundColor: '#F4CCCD',
  },
};

type HeroPanelAvatarPropsType = {
  activated: boolean,
  canBeIncapacitated: boolean,
  elite: boolean,
  enableEscape: boolean,
  firstName: string,
  hpBoost: number,
  id: string,
  index: number,
  isHero: boolean,
  isRebelPlayerTurn: boolean,
  parentDiv: ?HTMLDivElement,
  setRebelEscaped: Function,
  setRebelActivated: Function,
  withdrawn: boolean,
  withdrawnHeroCanActivate: boolean,
  wounded: boolean,
  woundRebelHero: Function,
};

type HeroPanelAvatarStateType = {
  displayPopup: boolean,
};

class HeroPanelAvatar extends React.Component<HeroPanelAvatarPropsType, HeroPanelAvatarStateType> {
  state = {
    displayPopup: false,
  };

  togglePopup() {
    this.setState((state: HeroPanelAvatarStateType) => ({displayPopup: !state.displayPopup}));
  }

  handlePopupPositioning: Function = (htmlDivPopup: ?HTMLDivElement) => {
    if (htmlDivPopup && this.props.parentDiv) {
      htmlDivPopup.style.top = `${this.props.index * 131 - this.props.parentDiv.scrollTop + 52}px`;
    }
  };

  handleClick = () => {
    // Don't allow popup if user is withdrawn AND we're not on a mission where withdrawn heroes can activate
    if (this.props.withdrawn && !this.props.withdrawnHeroCanActivate) {
      return;
    }
    this.togglePopup();
  };

  handleEndActivation = () => {
    this.props.setRebelActivated(this.props.id);
    this.togglePopup();
  };

  handleSetWounded = () => {
    this.props.woundRebelHero(this.props.id, this.props.withdrawnHeroCanActivate);
    this.togglePopup();
  };

  handleEscape = () => {
    this.props.setRebelEscaped(this.props.id);
    this.togglePopup();
  };

  renderPopup() {
    let buttonText = '';
    if (this.props.isHero) {
      buttonText = this.props.wounded ? 'Set withdrawn' : 'Set wounded';
    } else {
      buttonText = 'Defeat';
    }

    // Don't display the wound button in the follow conditions:
    // 1) Is a hero
    // 2) We're on a mission where withdrawn heroes can activate
    // 3) This hero is withdrawn
    // In that case we are allowing the panel to appear but since they are withdrawn they can't be killed again
    // Also don't show it if the figure is marked as being able to be incapicitated
    const doNotDisplayWoundButton =
      (this.props.isHero && this.props.withdrawnHeroCanActivate && this.props.withdrawn) ||
      this.props.canBeIncapacitated;

    return (
      <div style={styles.popup} ref={this.handlePopupPositioning}>
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
        {!this.props.activated && this.props.isRebelPlayerTurn ? (
          <Button text="End activation" onClick={this.handleEndActivation} />
        ) : null}
        {!doNotDisplayWoundButton ? (
          <Button text={buttonText} onClick={this.handleSetWounded} />
        ) : null}
        {!this.props.activated && this.props.isRebelPlayerTurn && this.props.enableEscape ? (
          <Button text="Escape" onClick={this.handleEscape} />
        ) : null}
        <div style={styles.popupAccent} />
        <div style={styles.popupMask} />
      </div>
    );
  }

  render() {
    const avatarStyles = Object.assign(
      {},
      this.props.elite ? styles.eliteAvatar : {},
      this.props.activated ? styles.activated : {},
      this.props.wounded ? styles.wounded : {},
      this.props.withdrawn ? styles.withdrawn : {}
    );

    return (
      <div style={styles.outer}>
        <div onClick={this.handleClick}>
          <HeroAvatar
            firstName={this.props.firstName}
            hpBoost={this.props.hpBoost}
            style={avatarStyles}
          />
        </div>
        {this.state.displayPopup ? this.renderPopup() : null}
      </div>
    );
  }
}

export default HeroPanelAvatar;
