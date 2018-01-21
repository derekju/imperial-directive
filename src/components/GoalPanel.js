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
  chainOfCommandTerminalInteract: Function,
  chainOfCommandWeissDefends: Function,
  chainOfCommandWeissEntered: Function,
  currentMission: string,
  generalWeissActive: boolean,
  generalWeissDeployed: boolean,
  generousDonationsTerminalDestroyed: Function,
  generousDonationsVirusUploaded: boolean,
  goalText: string[],
  incomingEnterCorridor: Function,
  looseCannonDefeatAtst: Function,
  spiceJobGetKeycard: Function,
  theSourceOfficerFreed: Function,
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

  handleTheSourceOfficerFreed = () => {
    this.setState({
      buttonPressed: true,
    });
    this.props.theSourceOfficerFreed();
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
    } else if (currentMission === 'theSource') {
      if (!this.state.buttonPressed) {
        return (
          <div style={styles.buttonContainer}>
            <Button text="Officer Freed" onClick={this.handleTheSourceOfficerFreed} />
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
    } else if (
      currentMission === 'generousDonations' &&
      this.props.generousDonationsVirusUploaded
    ) {
      return (
        <div>
          <div style={styles.buttonContainer}>
            <Button
              text="Terminal 1 Destroyed"
              width={180}
              onClick={() => this.props.generousDonationsTerminalDestroyed(1)}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Terminal 2 Destroyed"
              width={180}
              onClick={() => this.props.generousDonationsTerminalDestroyed(2)}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Terminal 3 Destroyed"
              width={180}
              onClick={() => this.props.generousDonationsTerminalDestroyed(3)}
            />
          </div>
        </div>
      );
    } else if (currentMission === 'chainOfCommand') {
      const weissDeployedGoalText = [
        '{BREAK}',
        '{BOLD}Weiss:{END}',
        'Weiss can interact with the AT-ST to enter it.',
      ];

      const weissActiveGoalText = [
        '{BREAK}',
        '{BOLD}General Weiss:{END}',
        'Cannot exit the hanger.',
        '{BREAK}',
        'When an attack targeting {ELITE}General Weiss{END} is declared, if the attack can cause 5 or more {DAMAGE}, click the button below.',
      ];

      return (
        <div>
          <div style={styles.buttonContainer}>
            <Button
              text="Terminal Interacted"
              width={180}
              onClick={this.props.chainOfCommandTerminalInteract}
            />
          </div>
          {this.props.generalWeissDeployed && !this.props.generalWeissActive ? (
            <div>
              <div style={styles.contents}>{this.renderGoals(weissDeployedGoalText)}</div>
              <div style={styles.buttonContainer}>
                <Button
                  text="Weiss entered AT-ST"
                  width={180}
                  onClick={this.props.chainOfCommandWeissEntered}
                />
              </div>
            </div>
          ) : null}
          {this.props.generalWeissDeployed && this.props.generalWeissActive ? (
            <div>
              <div style={styles.contents}>{this.renderGoals(weissActiveGoalText)}</div>
              <div style={styles.buttonContainer}>
                <Button
                  text="Weiss defends"
                  width={180}
                  onClick={this.props.chainOfCommandWeissDefends}
                />
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return null;
  }

  renderGoals(goalText: string[]) {
    if (goalText.length === 0) {
      return null;
    }

    return goalText.map((gText: string, index: number) => {
      return (
        <div key={`goal-${index}`} dangerouslySetInnerHTML={{__html: handleTextSubs(gText)}} />
      );
    });
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Mission Goals</div>
        <div style={styles.contents}>{this.renderGoals(this.props.goalText)}</div>
        <div>{this.renderMissionSpecific()}</div>
      </div>
    );
  }
}

export default GoalPanel;
