// @flow

import {expandText, generateTextArray, replaceAttackMoveText} from '../lib/iconSubber';
import {ELITE_RED, IMPERIAL_BLUE, LIGHT_WHITE} from '../styles/colors';
import buffs from '../data/buffs.json';
import Button from './Button';
import type {ImperialUnitType} from '../reducers/imperials';
import {positionAbsolute} from '../styles/mixins';
import random from 'lodash/random';
import React from 'react';

const styles = {
  base: {
    backgroundColor: LIGHT_WHITE,
    border: '2px solid black',
    paddingBottom: '50px',
    position: 'relative',
  },
  buffContainer: {
    backgroundColor: 'white',
    border: `2px solid ${ELITE_RED}`,
    fontSize: '14px',
    margin: '10px auto 5px',
    padding: '10px',
    textAlign: 'center',
    width: '300px',
  },
  buffName: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    ...positionAbsolute(null, 0, 10, 0),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  commandContainer: {
    fontSize: '14px',
    padding: '10px',
  },
  commandEntry: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  condition: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  header: {
    backgroundColor: IMPERIAL_BLUE,
    color: 'white',
    padding: '10px',
    textAlign: 'center',
  },
  icon: {
    height: '18px',
    marginRight: '3px',
    verticalAlign: 'middle',
    width: '19px',
  },
  iconStyle: {
    marginRight: '3px',
    verticalAlign: 'middle',
    width: '19px',
  },
};

type AiCardPropsType = {
  attackTarget: string,
  customAI: ?(Object[]),
  group: ImperialUnitType,
  moveTarget: string,
  setImperialGroupActivated: Function,
};

class AiCard extends React.PureComponent<AiCardPropsType> {
  // Store the random buff so we don't pick another one if this component re-renders
  // PureComponent stops it on every render but if the attack target changes, it'll still re-render
  chosenBuffIndex: ?number;

  renderCommand(key: string, condition: string, command: string) {
    const commandArray = generateTextArray(command);
    return (
      <div style={styles.commandEntry} key={key}>
        <div style={styles.condition}>{`${replaceAttackMoveText(
          condition,
          this.props.attackTarget,
          this.props.moveTarget
        )}:`}</div>
        <div>
          {commandArray.map((text: string, index: number) =>
            expandText(text, index, this.props.attackTarget, this.props.moveTarget, styles.icon)
          )}
        </div>
      </div>
    );
  }

  handleGroupActivated = () => {
    this.props.setImperialGroupActivated(this.props.group);
  };

  renderBuff() {
    // Pick a random one from the buff list if we don't have one already
    // Since we aren't doing anything more complicated than just picking a random one, just
    // put the business logic here. If we ever do anymore more, MOVE IT OUT!
    if (!this.chosenBuffIndex) {
      this.chosenBuffIndex = random(0, this.props.group.buffs.length - 1);
    }
    const randomBuff = this.props.group.buffs[this.chosenBuffIndex];
    const buff = buffs[randomBuff];

    return (
      <div>
        <div style={styles.buffName}>{buff.name}</div>
        <br />
        {buff.text.map((buffText: string) => {
          const textArray = generateTextArray(buffText);
          return textArray.map((text: string, index: number) =>
            expandText(
              text,
              index,
              this.props.attackTarget,
              this.props.moveTarget,
              styles.iconStyle
            )
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{`${this.props.group.name} G${
          this.props.group.groupNumber
        }`}</div>
        <div style={styles.buffContainer}>{this.renderBuff()}</div>
        <div style={styles.commandContainer}>
          {this.props.customAI
            ? this.props.customAI.map((customAI, index) =>
                this.renderCommand(`custom-${index}`, customAI.condition, customAI.command)
              )
            : null}
          {this.props.group.commands.map((command, index) =>
            this.renderCommand(
              `${this.props.group.name}-${index}`,
              command.condition,
              command.command
            )
          )}
        </div>
        <div style={styles.buttonContainer}>
          <Button onClick={this.handleGroupActivated} text="All figures activated" width={200} />
        </div>
      </div>
    );
  }
}

export default AiCard;
