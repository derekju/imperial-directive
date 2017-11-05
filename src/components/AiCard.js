// @flow

import {IMPERIAL_BLUE} from '../styles/colors';
import React from 'react';
import replace from 'lodash/replace';
import Stormtrooper from './commands/Stormtrooper';

const styles = {
  base: {
    border: '2px solid black',
    width: '500px',
    // height: '300px',
  },
  commandContainer: {
    fontSize: '14px',
    padding: '5px',
  },
  commandEntry: {
    marginBottom: '10px',
  },
  condition: {
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: IMPERIAL_BLUE,
    color: 'white',
    padding: '5px',
  },
};

type AiCardCommandType = {
  condition: string,
  command: string,
};

type AiCardPropsType = {
  commands: AiCardCommandType[],
  name: string,
};

class AiCard extends React.Component<AiCardPropsType> {

  // printAndSubtituteCommand(command: string) {
  //   let replacedCommand = replace(command, '[ACTION]', '<img src=
  // }

  // renderCommand(key: string, condition: string, command: string) {
  //   return (
  //     <div style={styles.commandEntry} key={key}>
  //       <div style={styles.condition}>{`${condition}:`}</div>
  //       <div>{this.printAndSubtituteCommand(command)}</div>
  //     </div>
  //   );
  // }

  render() {
    const baseClass = this.props.elite ? 'AiCardElite' : 'AiCard';

    return (
      <div style={styles.base}>
        <div style={styles.header}>{this.props.name}</div>
        <div style={styles.commandContainer}>
          <Stormtrooper priorityTarget="the nearest terminal" />
        </div>
      </div>
    );
  }
}

/*
          {this.props.commands.map((command, index) =>
            this.renderCommand(`${this.props.name}-${index}`, command.condition, command.command)
          )}
*/




export default AiCard;
