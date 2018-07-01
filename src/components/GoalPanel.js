// @flow

import Button from './Button';
import handleTextSubs from './utils/handleTextSubs';
import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    overflowY: 'scroll',
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
  armedAndOperationalWarshipDestroyed: Function,
  chainOfCommandTerminalInteract: Function,
  chainOfCommandWeissDefends: Function,
  chainOfCommandWeissEntered: Function,
  currentMission: string,
  desperateHourClearingReachable: boolean,
  desperateHourEnteredClearing: Function,
  fireInTheSkyCanDepart: boolean,
  fireInTheSkyDepart: Function,
  forestAmbushCampEntered: boolean,
  forestAmbushSetCampEntered: Function,
  generalWeissActive: boolean,
  generalWeissDeployed: boolean,
  generousDonationsTerminalDestroyed: Function,
  generousDonationsVirusUploaded: boolean,
  goalText: string[],
  incomingEnterCorridor: Function,
  lastStandVaderBlock: Function,
  lastStandVaderDeployed: boolean,
  looseCannonDefeatAtst: Function,
  pastLifeEnemiesActivateC3PO: Function,
  rewardOldWoundsEarned: boolean,
  spiceJobGetKeycard: Function,
  sympathyForTheRebellionHeroClaim: Function,
  sympathyForTheRebellionImperialClaim: Function,
  sympathyForTheRebellionImperialDefeatRebel: Function,
  sympathyForTheRebellionImperialDone: Function,
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
            <Button text="Keycard Found" onClick={this.handleSpiceJobGetKeycard} />
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
              <Button text="Hero Gets Core" width={180} onClick={this.props.vipersDenHeroGetCore} />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Imperial Gets Core"
                width={180}
                onClick={this.props.vipersDenImperialGetCore}
              />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Figure Drops Core"
                width={180}
                onClick={this.props.vipersDenFigureDropsCore}
              />
            </div>
            <div style={styles.buttonContainer}>
              <Button
                text="Imperial Escapes"
                width={180}
                onClick={this.props.vipersDenImperialEscapes}
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
    } else if (currentMission === 'lastStand' && this.props.lastStandVaderDeployed) {
      return (
        <div style={styles.buttonContainer}>
          <Button text="Add 2 Block" onClick={this.props.lastStandVaderBlock} />
        </div>
      );
    } else if (currentMission === 'desperateHour' && this.props.desperateHourClearingReachable) {
      return (
        <div style={styles.buttonContainer}>
          <Button text="Clearing Entered" onClick={this.props.desperateHourEnteredClearing} />
        </div>
      );
    } else if (currentMission === 'sympathyForTheRebellion') {
      const imperialRecruitGoalText = [
        '{BREAK}',
        '{BOLD}Imperial Recruits:{END}',
        'At the end of the Round, click the top button for each token the Imperial player has.',
        'Click the bottom button to proceed once done.',
        '{BREAK}',
        'Manually defeat each figure that has a token.',
        '{BREAK}',
      ];

      const imperialDefeatRebelGoalText = [
        '{BREAK}',
        '{BOLD}Rebel Defeat:{END}',
        'Click the button to add tokens for the Imperial player if a Rebel Hero or Luke is defeated.',
        '{BREAK}',
      ];

      return (
        <div>
          <div style={styles.buttonContainer}>
            <Button
              text="Hero Enters Exit"
              width={180}
              onClick={this.props.sympathyForTheRebellionHeroClaim}
            />
          </div>
          <div style={styles.contents}>{this.renderGoals(imperialRecruitGoalText)}</div>
          <div style={styles.buttonContainer}>
            <Button
              text="Process token"
              width={180}
              onClick={this.props.sympathyForTheRebellionImperialClaim}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Done with tokens"
              width={180}
              onClick={this.props.sympathyForTheRebellionImperialDone}
            />
          </div>
          <div style={styles.contents}>{this.renderGoals(imperialDefeatRebelGoalText)}</div>
          <div style={styles.buttonContainer}>
            <Button
              text="Add token"
              width={180}
              onClick={this.props.sympathyForTheRebellionImperialDefeatRebel}
            />
          </div>
        </div>
      );
    } else if (currentMission === 'armedAndOperational') {
      return (
        <div style={styles.buttonContainer}>
          <Button
            text="Warship Destroyed"
            width={180}
            onClick={this.props.armedAndOperationalWarshipDestroyed}
          />
        </div>
      );
    } else if (currentMission === 'pastLifeEnemies') {
      return (
        <div style={styles.buttonContainer}>
          <Button
            text="Activate C3PO"
            width={180}
            onClick={this.props.pastLifeEnemiesActivateC3PO}
          />
        </div>
      );
    } else if (currentMission === 'fireInTheSky' && this.props.fireInTheSkyCanDepart) {
      return (
        <div style={styles.buttonContainer}>
          <Button text="Depart" width={180} onClick={this.props.fireInTheSkyDepart} />
        </div>
      );
    } else if (currentMission === 'forestAmbush' && !this.props.forestAmbushCampEntered) {
      const forestAmbushCampText = [
        '{BOLD}Camp Entry:{END}',
        'Click the bottom button once a hero has entered the camp.',
        '{BREAK}',
      ];

      return (
        <div>
          <div style={styles.contents}>{this.renderGoals(forestAmbushCampText)}</div>
          <div style={styles.buttonContainer}>
            <Button
              text="Camp Entered"
              width={180}
              onClick={this.props.forestAmbushSetCampEntered}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  renderRewards() {
    if (this.props.rewardOldWoundsEarned) {
      const oldWoundsRewardText = [
        '{BREAK}',
        '{BOLD}Old Wounds:{END}',
        'When a wounded hero is attacking, apply -1 {DAMAGE} to the attack results.',
      ];

      return <div style={styles.contents}>{this.renderGoals(oldWoundsRewardText)}</div>;
    }
  }

  renderGoals(goalText: string[]) {
    if (goalText.length === 0) {
      return null;
    }

    return (goalText.map((gText: string, index: number) => {
      return (
        <div key={`goal-${index}`} dangerouslySetInnerHTML={{__html: handleTextSubs(gText)}} />
      );
    }): Array<*>);
  }

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Mission Goals</div>
        <div style={styles.contents}>{this.renderGoals(this.props.goalText)}</div>
        <div>{this.renderMissionSpecific()}</div>
        <div>{this.renderRewards()}</div>
      </div>
    );
  }
}

export default GoalPanel;
