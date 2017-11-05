// @flow

import actionPng from '../../assets/icons/action.png';
import React from 'react';
import surgePng from '../../assets/icons/surge.png';

const styles = {
  base: {

  },
  command: {

  },
  commandContainer: {
    fontSize: '14px',
    padding: '5px',
  },
  commandEntry: {
    marginBottom: '20px',
  },
  condition: {
    fontWeight: 'bold',
    marginBottom: '3px',
  },
  icon: {
    height: '18px',
    marginRight: '5px',
    verticalAlign: 'middle',
    width: '19px',
  },
  iconNoMargin: {
    height: '18px',
    verticalAlign: 'middle',
    width: '19px',
  },
};

type StormtrooperPropsType = {
  priorityTarget: string,
};

class Stormtrooper extends React.Component<StormtrooperPropsType> {

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.commandEntry}>
          <div style={styles.condition}>If within 4 spaces of any target:</div>
          <div style={styles.command}>
            <img src={actionPng} style={styles.icon} />
            <span>Attack a target, then </span>
            <img src={actionPng} style={styles.icon} />
            <span>Engage {this.props.priorityTarget}.</span>
          </div>
        </div>
        <div style={styles.commandEntry}>
          <div style={styles.condition}>If within 6 spaces of any target:</div>
          <div style={styles.command}>
            <img src={actionPng} style={styles.icon} />
            <span>Spot a target, then </span>
            <img src={actionPng} style={styles.icon} />
            <span>Attack the target, then Retreat towards {this.props.priorityTarget}.</span>
          </div>
        </div>
        <div style={styles.commandEntry}>
          <div style={styles.condition}>If no target within 6 spaces:</div>
          <div style={styles.command}>
            <img src={actionPng} style={styles.icon} />
            <span>Engage {this.props.priorityTarget}.</span>
          </div>
        </div>
        <div style={styles.commandEntry}>
          <div style={styles.condition}>Reaction: If adjacent to another friendly Trooper while attacking:</div>
          <div style={styles.command}>
            <span>If within attack range, use Squad Training ability to reroll a </span>
            <img src={surgePng} style={styles.iconNoMargin} />
            <span>.</span>
          </div>
        </div>
      </div>
    );
  }
}

export default Stormtrooper;
