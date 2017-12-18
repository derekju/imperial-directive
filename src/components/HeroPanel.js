// @flow

import HeroPanelAvatar from './HeroPanelAvatar';
import noop from 'lodash/noop';
import React from 'react';
import rebels from '../data/rebels.json';

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
    display: 'flex',
    flexDirection: 'column',
    height: '622px',
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
  enableEscape: boolean,
  hpBoosts: {[id: string]: number},
  isRebelPlayerTurn: boolean,
  roster: string[],
  setRebelEscaped: Function,
  setRebelActivated: Function,
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
          {this.props.roster.map((id: string, index: number) => {
            const canHeroActivateTwice = this.props.canActivateTwice.includes(id);
            const numTimesHeroHasActivated = this.props.activatedRebels.filter(
              (rebelId: string) => rebelId === id
            ).length;
            let nameToDisplay = rebels[id].firstName;
            if (canHeroActivateTwice) {
              const timesLeft = 2 - numTimesHeroHasActivated;
              nameToDisplay = `${nameToDisplay} x${timesLeft}`;
            }

            return (
              <div key={id} style={styles.heroPanelAvatarContainer}>
                <HeroPanelAvatar
                  activated={
                    canHeroActivateTwice
                      ? numTimesHeroHasActivated === 2
                      : this.props.activatedRebels.includes(id)
                  }
                  elite={rebels[id].elite}
                  enableEscape={this.props.enableEscape}
                  firstName={nameToDisplay}
                  hpBoost={this.props.hpBoosts[id] || 0}
                  id={id}
                  index={index}
                  isHero={rebels[id].type === 'hero'}
                  isRebelPlayerTurn={this.props.isRebelPlayerTurn}
                  parentDiv={this.state.htmlDivAvatarContainer}
                  setRebelEscaped={this.props.isRebelPlayerTurn ? this.props.setRebelEscaped : noop}
                  setRebelActivated={
                    this.props.isRebelPlayerTurn ? this.props.setRebelActivated : noop
                  }
                  withdrawn={this.props.withdrawnHeroes.includes(id)}
                  wounded={this.props.woundedHeroes.includes(id)}
                  woundRebelHero={
                    rebels[id].type === 'hero'
                      ? this.props.woundRebelHero
                      : this.props.woundRebelOther
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
