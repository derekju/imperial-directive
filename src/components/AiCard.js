// @flow

import {IMPERIAL_BLUE} from '../styles/colors';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '267px',
    height: '300px',
  },
  commandContainer: {
    fontSize: '13px',
    padding: '5px',
  },
  header: {
    backgroundColor: IMPERIAL_BLUE,
    color: 'white',
    padding: '5px',
  },
};

class AiCard extends React.Component<{}> {
  renderCommand(key, condition, command) {
    return (
      <div key={key}>
        <div className="AiCard-condition">{`${condition}:`}</div>
        <div className="AiCard-command">{command}</div>
      </div>
    );
  }

  render() {
    const baseClass = this.props.elite ? 'AiCardElite' : 'AiCard';

    return (
      <div style={styles.base}>
        <div style={styles.header}>{this.props.name}</div>
        <div style={styles.commandContainer}>
          {this.props.commands.map((command, index) =>
            this.renderCommand(`${this.props.name}-${index}`, command.condition, command.command)
          )}
        </div>
      </div>
    );
  }
}

export default AiCard;
