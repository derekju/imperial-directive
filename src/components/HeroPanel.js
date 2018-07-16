// @flow

import HeroPanelAvatar from './HeroPanelAvatar';
import noop from 'lodash/noop';
import React from 'react';
import type {RebelUnitType} from '../reducers/rebels';

const styles = {
  avatarContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    overflow: 'scroll',
  },
  base: {
    border: '2px solid black',
    flex: 1,
    flexDirection: 'column',
    width: '110px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
    textAlign: 'center',
  },
  heroPanelAvatarContainer: {
    padding: '10px 0',
  },
};

type HeroPanelPropsType = {
  activatedRebels: string[],
  canActivateTwice: string[],
  canIncapacitate: string[],
  enableEscape: boolean,
  fakeWithdrawnHeroes: string[],
  isRebelPlayerTurn: boolean,
  roster: RebelUnitType[],
  setRebelEscaped: Function,
  setRebelActivated: Function,
  withdrawnHeroCanActivate: boolean,
  withdrawnHeroes: string[],
  woundedHeroes: string[],
  woundRebelHero: Function,
  woundRebelOther: Function,
};

type HeroPanelStateType = {
  htmlDivAvatarContainer: ?HTMLDivElement,
};

class HeroPanel extends React.Component<HeroPanelPropsType, HeroPanelStateType> {
  state = {
    htmlDivAvatarContainer: null,
  };

  saveSectionContents = (htmlDivAvatarContainer: ?HTMLDivElement) => {
    this.setState({htmlDivAvatarContainer});
  };

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Heroes</div>
        <div style={styles.avatarContainer} ref={this.saveSectionContents}>
          {this.props.roster.map((unit: RebelUnitType, index: number) => {
            const {currentNumFigures, elite, firstName, hpBoost, id, maxInGroup, type} = unit;
            const canHeroActivateTwice = this.props.canActivateTwice.includes(id);
            const numTimesHeroHasActivated = this.props.activatedRebels.filter(
              (rebelId: string) => rebelId === id
            ).length;
            let nameToDisplay = firstName;
            if (canHeroActivateTwice) {
              const timesLeft = 2 - numTimesHeroHasActivated;
              nameToDisplay = `${nameToDisplay} x${timesLeft}`;
            }
            if (maxInGroup > 1) {
              nameToDisplay = `${nameToDisplay} (${currentNumFigures})`;
            }

            return (
              <div key={id} style={styles.heroPanelAvatarContainer}>
                <HeroPanelAvatar
                  activated={
                    canHeroActivateTwice
                      ? numTimesHeroHasActivated === 2
                      : this.props.activatedRebels.includes(id)
                  }
                  canBeIncapacitated={this.props.canIncapacitate.includes(id)}
                  elite={elite}
                  enableEscape={this.props.enableEscape}
                  firstName={nameToDisplay}
                  hpBoost={hpBoost || 0}
                  id={id}
                  index={index}
                  isHero={type === 'hero'}
                  isRebelPlayerTurn={this.props.isRebelPlayerTurn}
                  parentDiv={this.state.htmlDivAvatarContainer}
                  setRebelEscaped={this.props.isRebelPlayerTurn ? this.props.setRebelEscaped : noop}
                  setRebelActivated={
                    this.props.isRebelPlayerTurn ? this.props.setRebelActivated : noop
                  }
                  withdrawn={
                    this.props.withdrawnHeroes.includes(id) ||
                    this.props.fakeWithdrawnHeroes.includes(id)
                  }
                  withdrawnHeroCanActivate={this.props.withdrawnHeroCanActivate}
                  wounded={this.props.woundedHeroes.includes(id)}
                  woundRebelHero={
                    type === 'hero' ? this.props.woundRebelHero : this.props.woundRebelOther
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default HeroPanel;
