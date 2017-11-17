// @flow

import {ELITE_RED} from '../styles/colors';
import type {EventType} from '../reducers/events';
import {expandText, generateTextArray} from '../lib/iconSubber';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '200px',
  },
  contents: {
    fontSize: '14px',
    padding: '15px 5px',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
  iconStyle: {
    marginRight: '3px',
    verticalAlign: 'middle',
    width: '19px',
  },
  title: {
    fontWeight: 'bold',
  },
  type: {
    color: ELITE_RED,
  },
};

type EventPanelPropsType = {
  activeEvent: ?EventType,
};

class EventPanel extends React.Component<EventPanelPropsType> {
  renderEvent() {
    if (!this.props.activeEvent) {
      return null;
    }

    return (
      <div>
        <div style={styles.title}>{this.props.activeEvent.name}</div>
        <br />
        <div style={styles.type}>{this.props.activeEvent.type}</div>
        {this.props.activeEvent.text.map((activeEventText: string, index: number) => {
          const textArray = generateTextArray(activeEventText);
          return (
            <div>
              <br />
              {textArray.map((text: string, index: number) =>
                expandText(text, index, styles.iconStyle)
              )}
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Current Event</div>
        <div style={styles.contents}>{this.renderEvent()}</div>
      </div>
    );
  }
}

export default EventPanel;
