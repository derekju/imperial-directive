// @flow

import {expandText, generateTextArray} from '../lib/iconSubber';
import {ELITE_RED, IMPERIAL_BLUE, LIGHT_WHITE} from '../styles/colors';
import actionPng from '../assets/icons/action.png';
import buffs from '../data/buffs.json';
import Button from './Button';
import type {ImperialUnitType} from '../reducers/imperials';
import {positionAbsolute} from '../styles/mixins';
import random from 'lodash/random';
import React from 'react';
import surgePng from '../assets/icons/surge.png';

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
    margin: '10px auto 0',
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
    textAlign: 'center',
  },
  condition: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  header: {
    backgroundColor: IMPERIAL_BLUE,
    color: 'white',
    padding: '5px',
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
  group: ImperialUnitType,
  priorityTarget: string,
  setImperialGroupActivated: Function,
};

class AiCard extends React.Component<AiCardPropsType> {
  expandCommand = (command: string, index: number) => {
    switch (command) {
      case '{ACTION}':
        return <img key={`${command}-${index}`} alt="Action" src={actionPng} style={styles.icon} />;
      case '{SURGE}':
        return <img key={`${command}-${index}`} alt="Action" src={surgePng} style={styles.icon} />;
      case '{PRIORITY_TARGET}':
        return <span key={`${command}-${index}`}>{this.props.priorityTarget}</span>;
      default:
        return <span key={`${command}-${index}`}>{command}</span>;
    }
  };

  printAndSubtituteCommand(command: string) {
    let commandToProcess = command;
    // Break command up into components
    const commandArray = [];
    while (commandToProcess.search(/\{.*\}/) !== -1) {
      const index = commandToProcess.search(/\{.*\}/);
      if (index !== 0) {
        commandArray.push(commandToProcess.slice(0, index));
        commandToProcess = commandToProcess.slice(index);
      }
      // Now find the } so we store that too
      const bracketIndex = commandToProcess.search('}');
      commandArray.push(commandToProcess.slice(0, bracketIndex + 1));
      commandToProcess = commandToProcess.slice(bracketIndex + 1);
    }

    // Push the rest
    commandArray.push(commandToProcess);

    return commandArray;
  }

  renderCommand(key: string, condition: string, command: string) {
    const commandArray = this.printAndSubtituteCommand(command);
    return (
      <div style={styles.commandEntry} key={key}>
        <div style={styles.condition}>{`${condition}:`}</div>
        <div>{commandArray.map(this.expandCommand)}</div>
      </div>
    );
  }

  handleGroupActivated = () => {
    this.props.setImperialGroupActivated(this.props.group);
  };

  renderBuff() {
    // Pick a random one from the buff list
    // Since we aren't doing anything more complicated than just picking a random one, just
    // put the business logic here. If we ever do anymore more, MOVE IT OUT!
    const randomNumber = random(0, this.props.group.buffs.length - 1);
    const randomBuff = this.props.group.buffs[randomNumber];
    const buff = buffs[randomBuff];

    return (
      <div>
        <div style={styles.buffName}>{buff.name}</div>
        <br />
        {buff.text.map((buffText: string) => {
          const textArray = generateTextArray(buffText);
          return textArray.map((text: string, index: number) =>
            expandText(text, index, styles.iconStyle)
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>{this.props.group.name}</div>
        <div style={styles.buffContainer}>{this.renderBuff()}</div>
        <div style={styles.commandContainer}>
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
