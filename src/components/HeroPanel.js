// @flow

import noop from 'lodash/noop';
import React from 'react';
import rebels from '../data/rebels.json';
import UnitAvatar from './UnitAvatar';

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
    height: '675px',
    width: '120px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

type HeroPanelPropsType = {
  activatedRebels: string[],
  isRebelPlayerTurn: boolean,
  setRebelHeroActivated: Function,
  roster: string[],
};

class HeroPanel extends React.Component<HeroPanelPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Heroes</div>
        <div style={styles.avatarContainer}>
          {this.props.roster.map((id: string) => (
            <UnitAvatar
              activated={this.props.activatedRebels.includes(id)}
              displayFullName={false}
              elite={rebels[id].elite}
              firstName={rebels[id].firstName}
              id={id}
              key={id}
              lastName={rebels[id].lastName}
              setRebelHeroActivated={this.props.isRebelPlayerTurn ? this.props.setRebelHeroActivated : noop}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default HeroPanel;
