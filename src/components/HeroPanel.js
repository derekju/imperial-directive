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
    justifyContent: 'space-around',
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
};

type HeroPanelPropsType = {
  activatedRebels: string[],
  canActivateTwice: string[],
  isRebelPlayerTurn: boolean,
  roster: string[],
  setRebelEscaped: Function,
  setRebelActivated: Function,
  withdrawnHeroes: string[],
  woundedHeroes: string[],
  woundRebelHero: Function,
  woundRebelOther: Function,
};

class HeroPanel extends React.Component<HeroPanelPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Heroes</div>
        <div style={styles.avatarContainer}>
          {this.props.roster.map((id: string) => {
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
              <HeroPanelAvatar
                activated={
                  canHeroActivateTwice
                    ? numTimesHeroHasActivated === 2
                    : this.props.activatedRebels.includes(id)
                }
                elite={rebels[id].elite}
                firstName={nameToDisplay}
                id={id}
                isRebelPlayerTurn={this.props.isRebelPlayerTurn}
                key={id}
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
            );
          })}
        </div>
      </div>
    );
  }
}

export default HeroPanel;
