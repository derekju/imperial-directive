// @flow

import {expandText, generateTextArray, replaceAttackMoveText} from '../lib/iconSubber';
import {ELITE_RED, IMPERIAL_BLUE, LIGHT_WHITE} from '../styles/colors';
import buffs from '../data/buffs.json';
import Button from './Button';
import Circle from './Circle';
import type {ImperialUnitType} from '../reducers/imperials';
import {positionAbsolute} from '../styles/mixins';
import random from 'lodash/random';
import roll from '../lib/roll';
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
  customAIExceptionList: string[],
  customUnitAI: {[string]: Object[]},
  group: ImperialUnitType,
  moveTarget: string,
  rewardImperialIndustryEarned: boolean,
  setImperialGroupActivated: Function,
};

class AiCard extends React.PureComponent<AiCardPropsType> {
  // Store the random buff so we don't pick another one if this component re-renders
  // PureComponent stops it on every render but if the attack target changes, it'll still re-render
  chosenBuffIndex: ?number;

  componentWillUpdate(nextProps: AiCardPropsType) {
    // Clear the index if we are updating the group in place
    if (nextProps.group.id !== this.props.group.id) {
      this.chosenBuffIndex = null;
    }
  }

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
    const groupBuffList = this.props.group.buffs.slice();

    // Pick a random one from the buff list if we don't have one already
    // Since we aren't doing anything more complicated than just picking a random one, just
    // put the business logic here. If we ever do anymore, MOVE IT OUT!
    if (!this.chosenBuffIndex) {
      // If Imperial Industry is chosen, we're just going to add it to the list of applicable
      // buffs for a unit
      // We have to make it hard to earn though so we'll need to roll to even add it to the list
      if (this.props.rewardImperialIndustryEarned) {
        // Just use a 50% chance, since the buff gets added to the group list which has to roll again
        // This is probably a really bad place to do this but I'll leave this refactor for a future
        // date
        if (roll(50)) {
          groupBuffList.push('imperialIndustry');
        }
      }
      this.chosenBuffIndex = random(0, groupBuffList.length - 1);
    }
    const randomBuff = groupBuffList[this.chosenBuffIndex];
    const buff = buffs[randomBuff];

    // Not sure why buff isn't defined sometimes but error check so the app doesn't crash
    if (buff) {
      return (
        <div key={`buff.name-${String(new Date())}`}>
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
    } else {
      return <div>None</div>;
    }
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>
          {this.props.group.name}
          <Circle
            color={this.props.group.alias.color}
            isSelected={true}
            number={this.props.group.alias.number}
            useSmallSize={true}
          />
        </div>
        <div style={styles.buffContainer}>{this.renderBuff()}</div>
        <div style={styles.commandContainer}>
          {this.props.customUnitAI[this.props.group.id] !== undefined
            ? this.props.customUnitAI[this.props.group.id].map((customAI, index) =>
                this.renderCommand(`custom-${index}`, customAI.condition, customAI.command)
              )
            : null}
          {this.props.customAI && !this.props.customAIExceptionList.includes(this.props.group.id)
            ? this.props.customAI.map((customAI, index) =>
                this.renderCommand(`custom-${index}`, customAI.condition, customAI.command)
              )
            : null}
          {this.props.customUnitAI[this.props.group.id] === undefined
            ? this.props.group.commands.map((command, index) =>
                this.renderCommand(
                  `${this.props.group.name}-${index}`,
                  command.condition,
                  command.command
                )
              )
            : null}
        </div>
        <div style={styles.buttonContainer}>
          <Button onClick={this.handleGroupActivated} text="All figures activated" width={200} />
        </div>
      </div>
    );
  }
}

export default AiCard;
