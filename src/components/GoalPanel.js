// @flow

import Button from './Button';
import handleTextSubs from './utils/handleTextSubs';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    width: '200px',
  },
  buttonContainer: {
    fontSize: '13px',
    paddingBottom: '6px',
    paddingLeft: '6px',
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
  currentMission: string,
  goalText: string[],
  looseCannonDefeatAtst: Function,
};

type GoalPanelStateType = {
  buttonPressed: boolean,
};

class GoalPanel extends React.Component<GoalPanelPropsType, GoalPanelStateType> {
  static displayName = 'GoalPanel';

  state = {
    buttonPressed: false,
  };

  handleLooseCannonClick = () => {
    this.setState({
      buttonPressed: true,
    });
    this.props.looseCannonDefeatAtst();
  };

  renderMissionSpecific() {
    const {currentMission} = this.props;

    if (currentMission === 'looseCannon') {
      if (!this.state.buttonPressed) {
        return (
          <div style={styles.buttonContainer}>
            <Button text="Mark as defeated" onClick={this.handleLooseCannonClick} />
          </div>
        );
      } else {
        return <div style={styles.buttonContainer}>Defeated.</div>;
      }
    }

    return null;
  }

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
        <div>{this.renderMissionSpecific()}</div>
      </div>
    );
  }
}

export default GoalPanel;
