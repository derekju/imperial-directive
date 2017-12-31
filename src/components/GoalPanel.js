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
  incomingEnterCorridor: Function,
  looseCannonDefeatAtst: Function,
  spiceJobGetKeycard: Function,
  vipersDenFigureDropsCore: Function,
  vipersDenHeroGetCore: Function,
  vipersDenImperialEscapes: Function,
  vipersDenImperialGetCore: Function,
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

  handleSpiceJobGetKeycard = () => {
    this.setState({
      buttonPressed: true,
    });
    this.props.spiceJobGetKeycard();
  };

  handleIncomingEnterCorridor = () => {
    this.setState({
      buttonPressed: true,
    });
    this.props.incomingEnterCorridor();
  };

  handleVipersDenHeroGetCore = () => {
    this.props.vipersDenHeroGetCore();
  };

  handleVipersDenImperialGetCore = () => {
    this.props.vipersDenImperialGetCore();
  };

  handleVipersDenFigureDropsCore = () => {
    this.props.vipersDenFigureDropsCore();
  };

  handleVipersDenImperialEscapes = () => {
    this.props.vipersDenImperialEscapes();
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
        return <div style={styles.buttonContainer}>Defeated</div>;
      }
    } else if (currentMission === 'theSpiceJob') {
      if (!this.state.buttonPressed) {
        return (
          <div style={styles.buttonContainer}>
            <Button text="Get Keycard" onClick={this.handleSpiceJobGetKeycard} />
          </div>
        );
      } else {
        return null;
      }
    } else if (currentMission === 'incoming') {
      if (!this.state.buttonPressed) {
        return (
          <div style={styles.buttonContainer}>
            <Button text="Corridor Entered" onClick={this.handleIncomingEnterCorridor} />
          </div>
        );
      } else {
        return null;
      }
    } else if (currentMission === 'vipersDen') {
      if (!this.state.buttonPressed) {
        return (
          <div>
            <div style={styles.buttonContainer}>
              <Button text="Hero Gets Core" width={180} onClick={this.handleVipersDenHeroGetCore} />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Imperial Gets Core"
                width={180}
                onClick={this.handleVipersDenImperialGetCore}
              />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Figure Drops Core"
                width={180}
                onClick={this.handleVipersDenFigureDropsCore}
              />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Imperial Escapes"
                width={180}
                onClick={this.handleVipersDenImperialEscapes}
              />
            </div>
          </div>
        );
      } else {
        return null;
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
