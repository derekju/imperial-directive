// @flow

import handleTextSubs from './utils/handleTextSubs';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '200px',
  },
  contents: {
    fontSize: '13px',
    padding: '5px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

type GoalPanelPropsType = {
  goalText: string[],
};

class GoalPanel extends React.Component<GoalPanelPropsType> {
  renderGoals() {
    if (this.props.goalText.length === 0) {
      return null;
    }

    return (
      <div>
        {this.props.goalText.map((goalText: string, index: number) => {
          return (
            <div
              key={`goal-${index}`}
              dangerouslySetInnerHTML={{__html: handleTextSubs(goalText)}}
            />
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Mission Goals</div>
        <div style={styles.contents}>{this.renderGoals()}</div>
      </div>
    );
  }
}

export default GoalPanel;
