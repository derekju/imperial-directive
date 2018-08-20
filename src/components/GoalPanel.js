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
  braceForImpactHeroesDepart: Function,
  chainOfCommandTerminalInteract: Function,
  chainOfCommandWeissDefends: Function,
  chainOfCommandWeissEntered: Function,
  currentMission: string,
  desperateHourClearingReachable: boolean,
  desperateHourEnteredClearing: Function,
  escapeFromCloudCityPrisonerClaimed: Function,
  escapeFromCloudCityShuttleLaunched: Function,
  fireInTheSkyCanDepart: boolean,
  fireInTheSkyDepart: Function,
  forestAmbushCampEntered: boolean,
  forestAmbushSetCampEntered: Function,
  generalWeissActive: boolean,
  generalWeissDeployed: boolean,
  generousDonationsTerminalDestroyed: Function,
  generousDonationsVirusUploaded: boolean,
  goalText: string[],
  imperialEntanglementsAirlockReleased: Function,
  imperialEntanglementsSchematicsUploaded: Function,
  incomingEnterCorridor: Function,
  lastStandVaderBlock: Function,
  lastStandVaderDeployed: boolean,
  looseCannonDefeatAtst: Function,
  pastLifeEnemiesActivateC3PO: Function,
  pastLifeEnemiesDiscardTerminal1: Function,
  pastLifeEnemiesDiscardTerminal2: Function,
  pastLifeEnemiesDiscardTerminal3: Function,
  rewardBountyEarned: boolean,
  rewardOldWoundsEarned: boolean,
  spiceJobGetKeycard: Function,
  survivalOfTheFittestCaveRevealed: Function,
  survivalOfTheFittestCavernRevealed: Function,
  survivalOfTheFittestPassRevealed: Function,
  survivalOfTheFittestRevealEastOfTile12A: Function,
  survivalOfTheFittestRevealSouthOfTile04A: Function,
  survivalOfTheFittestRevealSouthOfTile17A: Function,
  sympathyForTheRebellionHeroClaim: Function,
  sympathyForTheRebellionImperialClaim: Function,
  sympathyForTheRebellionImperialDefeatRebel: Function,
  sympathyForTheRebellionImperialDone: Function,
  theHardWayAllTokensPlaced: Function,
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
      const pastLifeEnemiesTerminalText = ['{BREAK}', '{BOLD}Destroy Terminals:{END}'];

      return (
        <div>
          <div style={styles.buttonContainer}>
            <Button
              text="Activate C3PO"
              width={180}
              onClick={this.props.pastLifeEnemiesActivateC3PO}
            />
          </div>
          <div style={styles.contents}>{this.renderGoals(pastLifeEnemiesTerminalText)}</div>
          <div style={styles.buttonContainer}>
            <Button
              text="Destroy Terminal 1"
              width={180}
              onClick={this.props.pastLifeEnemiesDiscardTerminal1}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Destroy Terminal 2"
              width={180}
              onClick={this.props.pastLifeEnemiesDiscardTerminal2}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Destroy Terminal 3"
              width={180}
              onClick={this.props.pastLifeEnemiesDiscardTerminal3}
            />
          </div>
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
    } else if (currentMission === 'imperialEntanglements') {
      return (
        <div>
          <div style={styles.buttonContainer}>
            <Button
              text="Airlock Released"
              width={180}
              onClick={this.props.imperialEntanglementsAirlockReleased}
            />
          </div>
          <div style={styles.buttonContainer}>
            <Button
              text="Schematics Uploaded"
              width={180}
              onClick={this.props.imperialEntanglementsSchematicsUploaded}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  renderPlaceholder(gText: string) {
    const data = {
      braceForImpact: {
        '---PLACEHOLDER_BUTTON_1---': {
          handler: this.props.braceForImpactHeroesDepart,
          text: 'Heroes Depart',
        },
      },
      escapeFromCloudCity: {
        '---PLACEHOLDER_CLAIM_PRISONER---': {
          handler: this.props.escapeFromCloudCityPrisonerClaimed,
          text: 'Claim Prisoner',
        },
        '---PLACEHOLDER_SHUTTLE_LAUNCHED---': {
          handler: this.props.escapeFromCloudCityShuttleLaunched,
          text: 'Launch Shuttle',
        },
      },
      survivalOfTheFittest: {
        '---PLACEHOLDER_EAST_OF_TILE12A---': {
          handler: this.props.survivalOfTheFittestRevealEastOfTile12A,
          text: 'Reveal East of 12A',
        },
        '---PLACEHOLDER_NORTH_OF_TILE07A---': {
          handler: this.props.survivalOfTheFittestCavernRevealed,
          text: 'Reveal North of 07A',
        },
        '---PLACEHOLDER_SOUTH_OF_TILE03A---': {
          handler: this.props.survivalOfTheFittestPassRevealed,
          text: 'Reveal South of 03A',
        },
        '---PLACEHOLDER_SOUTH_OF_TILE04A---': {
          handler: this.props.survivalOfTheFittestRevealSouthOfTile04A,
          text: 'Reveal South of 04A',
        },
        '---PLACEHOLDER_SOUTH_OF_TILE09A---': {
          handler: this.props.survivalOfTheFittestCaveRevealed,
          text: 'Reveal South of 09A',
        },
        '---PLACEHOLDER_SOUTH_OF_TILE17A---': {
          handler: this.props.survivalOfTheFittestRevealSouthOfTile17A,
          text: 'Reveal South of 17A',
        },
        '---PLACEHOLDER_WEST_OF_TILE01A---': {
          handler: this.props.survivalOfTheFittestCavernRevealed,
          text: 'Reveal West of 01A',
        },
      },
      theHardWay: {
        '---PLACEHOLDER_ALL_STRAIN_TOKENS---': {
          handler: this.props.theHardWayAllTokensPlaced,
          text: 'All Strain Placed',
        },
      },
    };

    if (data[this.props.currentMission] && data[this.props.currentMission][gText]) {
      const blob = data[this.props.currentMission][gText];
      return (
        <div style={styles.buttonContainer}>
          <Button text={blob.text} width={180} onClick={blob.handler} />
        </div>
      );
    }
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

    if (this.props.rewardBountyEarned) {
      const bountyRewardText = [
        '{BREAK}',
        '{BOLD}Bounty:{END}',
        'Hunters cost one less threat to deploy.',
      ];

      return <div style={styles.contents}>{this.renderGoals(bountyRewardText)}</div>;
    }
  }

  renderGoals(goalText: string[]) {
    if (goalText.length === 0) {
      return null;
    }

    return (goalText.map((gText: string, index: number) => {
      if (gText.indexOf('---PLACEHOLDER') > -1) {
        return this.renderPlaceholder(gText);
      } else {
        return (
          <div key={`goal-${index}`} dangerouslySetInnerHTML={{__html: handleTextSubs(gText)}} />
        );
      }
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
