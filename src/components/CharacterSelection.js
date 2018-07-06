// @flow

import {EXPANSIONS, IMPERIAL_REWARDS} from '../reducers/app';
import {LIGHT_WHITE, REBEL_RED} from '../styles/colors';
import Button from './Button';
import HeroAvatar from './HeroAvatar';
import missions from '../data/missions.json';
import React from 'react';
import rebels from '../data/rebels.json';
import {BrowserRouter as Router} from 'react-router-dom';
import track from '../lib/track';
import units from '../data/units.json';
import without from 'lodash/without';

const styles = {
  avatarContainer: {
    cursor: 'pointer',
    padding: '10px',
  },
  base: {
    backgroundColor: LIGHT_WHITE,
    margin: '0 auto',
  },
  buttonSection: {
    margin: '20px auto',
    width: '310px',
  },
  cancelButton: {
    marginRight: '10px',
  },
  difficultyDescription: {
    fontSize: '13px',
    width: '400px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '150px',
  },
  label: {
    fontSize: '14px',
    marginRight: '10px',
  },
  section: {
    margin: '20px auto',
    width: '800px',
  },
  sectionContents: {
    alignItems: 'center',
    border: '2px solid black',
    borderTop: 'none',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '20px',
  },
  sectionContentsNoFlex: {
    alignItems: 'center',
    border: '2px solid black',
    borderTop: 'none',
    padding: '20px',
  },
  sectionDescription: {
    fontSize: '13px',
    fontStyle: 'italic',
    marginBottom: '10px',
  },
  sectionHeader: {
    borderBottom: '2px solid black',
  },
  selectInput: {
    fontSize: '14px',
    height: '40px',
    width: '300px',
  },
  selected: {
    border: `3px solid ${REBEL_RED}`,
  },
  selectedToggle: {
    border: `2px solid ${REBEL_RED}`,
  },
  threatButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    border: '2px solid black',
    borderRadius: '50px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '24px',
    height: '50px',
    justifyContent: 'center',
    marginRight: '10px',
    width: '50px',
  },
  threatInputSection: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginLeft: '30px',
  },
  threatNumber: {
    fontSize: '24px',
    marginRight: '10px',
  },
  threatTitle: {
    marginRight: '10px',
  },
  toggle: {
    alignItems: 'center',
    backgroundColor: 'white',
    border: '2px solid black',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '14px',
    height: '30px',
    justifyContent: 'center',
    marginRight: '20px',
    width: '120px',
  },
  toggleSection: {
    display: 'flex',
    flexDirection: 'row',
  },
};

type CharacterSelectionPropsType = {
  availableAllies: string[],
  availableHeroes: string[],
  availableMissions: string[],
  availableVillains: string[],
  history: Object,
  setAllyChosen: Function,
  setDifficulty: Function,
  setExpansions: Function,
  setImperialRewards: Function,
  setMission: Function,
  setMissionThreat: Function,
  setRoster: Function,
  setVillains: Function,
};

type CharacterSelectionStateType = {
  missionThreat: number,
  selectedDifficulty: string,
  selectedRoster: string[],
};

class CharacterSelection extends React.Component<
  CharacterSelectionPropsType,
  CharacterSelectionStateType
> {
  select: ?HTMLSelectElement;
  allySelect: ?HTMLSelectElement;

  state = {
    missionThreat: 2,
    selectedDifficulty: 'standard',
    selectedRoster: [],
  };

  cancel = () => {
    this.props.history.goBack();
  };

  submit = () => {
    let selectedAlly = '';
    if (this.allySelect) {
      selectedAlly = this.allySelect.options[this.allySelect.selectedIndex].value;
    }

    this.props.setRoster(this.state.selectedRoster.concat(selectedAlly ? [selectedAlly] : []));

    if (selectedAlly) {
      this.props.setAllyChosen(selectedAlly);
      track('setAlly', selectedAlly);
    }

    this.props.setMissionThreat(this.state.missionThreat);

    this.props.setDifficulty(this.state.selectedDifficulty);
    track('setDifficulty', this.state.selectedDifficulty);

    // Get which checkboxes are checked for rewards
    // Gonna just dig into the DOM to do this
    const imperialRewards = IMPERIAL_REWARDS.reduce((accumulator: Object, key: string) => {
      const checkbox = document.querySelector('#' + key);
      if (checkbox) {
        // $FlowFixMe
        accumulator[key] = checkbox.checked;
      }
      return accumulator;
    }, {});
    this.props.setImperialRewards(imperialRewards);

    // Get which checkboxes are checked for expansions
    // Gonna just dig into the DOM to do this
    const selectedExpansions = EXPANSIONS.reduce((accumulator: Object, key: string) => {
      const checkbox = document.querySelector('#' + key);
      if (checkbox) {
        // $FlowFixMe
        accumulator[key] = checkbox.checked;
      }
      return accumulator;
    }, {});
    this.props.setExpansions(selectedExpansions);

    // Get which checkboxes are checked for villains
    // Gonna just dig into the DOM to do this
    const selectedVillains = this.props.availableVillains.reduce(
      (accumulator: Object, key: string) => {
        const checkbox = document.querySelector('#' + key);
        if (checkbox) {
          // $FlowFixMe
          accumulator[key] = checkbox.checked;
        }
        return accumulator;
      },
      {}
    );
    this.props.setVillains(selectedVillains);

    if (this.select) {
      const selectedMission = this.select.options[this.select.selectedIndex].value;
      this.props.setMission(selectedMission);
    }

    this.props.history.push('/mission');
  };

  handleAvatarClick = (heroId: string) => {
    if (this.state.selectedRoster.includes(heroId)) {
      this.setState((prevState: CharacterSelectionStateType) => ({
        selectedRoster: without(prevState.selectedRoster, heroId),
      }));
    } else {
      this.setState((prevState: CharacterSelectionStateType) => {
        if (prevState.selectedRoster.length === 4) {
          return {
            selectedRoster: prevState.selectedRoster.slice(1).concat([heroId]),
          };
        } else {
          return {
            selectedRoster: prevState.selectedRoster.concat([heroId]),
          };
        }
      });
    }
  };

  saveSelect = (ref: ?HTMLSelectElement) => {
    this.select = ref;
  };

  saveAllySelect = (ref: ?HTMLSelectElement) => {
    this.allySelect = ref;
  };

  decrementThreat = () => {
    this.setState((prevState: CharacterSelectionStateType) => ({
      missionThreat: Math.max(2, prevState.missionThreat - 1),
    }));
  };

  incrementThreat = () => {
    this.setState((prevState: CharacterSelectionStateType) => ({
      missionThreat: Math.min(6, prevState.missionThreat + 1),
    }));
  };

  difficultyToggle = (difficulty: string) => {
    this.setState((prevState: CharacterSelectionStateType) => ({
      selectedDifficulty: difficulty,
    }));
  };

  renderSelectMission() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Select Mission</span>
        </div>
        <div style={styles.sectionContents}>
          <select ref={this.saveSelect} style={styles.selectInput}>
            {this.props.availableMissions.map((missionId: string) => (
              <option key={missionId} value={missionId}>
                {missions[missionId] ? missions[missionId].name : missionId}
              </option>
            ))}
          </select>
          <div style={styles.threatInputSection}>
            <div style={styles.threatTitle}>Mission Threat:</div>
            <div style={styles.threatButton} onClick={this.decrementThreat}>
              -
            </div>
            <div style={styles.threatNumber}>{this.state.missionThreat}</div>
            <div style={styles.threatButton} onClick={this.incrementThreat}>
              +
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderSelectHeroes() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Select Heroes</span>
        </div>
        <div style={styles.sectionContents}>
          {this.props.availableHeroes.map((heroId: string) => (
            <div
              key={heroId}
              style={styles.avatarContainer}
              onClick={() => this.handleAvatarClick(heroId)}
            >
              <HeroAvatar
                firstName={rebels[heroId].firstName}
                style={this.state.selectedRoster.includes(heroId) ? styles.selected : {}}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderSelectAlly() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Select Ally</span>
        </div>
        <div style={styles.sectionContents}>
          <select ref={this.saveAllySelect} style={styles.selectInput}>
            <option key="none" value="">
              None
            </option>
            {this.props.availableAllies.map((allyId: string) => (
              <option key={allyId} value={allyId}>
                {`${rebels[allyId].firstName} ${rebels[allyId].lastName}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  renderSelectVillains() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Select Villains</span>
        </div>
        <div style={styles.sectionContentsNoFlex}>
          <div style={styles.sectionDescription}>
            Select which villains the Imperials have unlocked during the campaign.
          </div>
          <div style={styles.toggleSection}>
            {this.props.availableVillains.map((villainId: string) => (
              <div>
                <input type="checkbox" id={villainId} />
                <label style={styles.label} htmlFor={villainId}>
                  {units[villainId].name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderDifficultySection() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Difficulty</span>
        </div>
        <div style={styles.sectionContents}>
          <div style={styles.toggleSection}>
            <div
              onClick={() => this.difficultyToggle('standard')}
              style={{
                ...styles.toggle,
                ...(this.state.selectedDifficulty === 'standard' ? styles.selectedToggle : {}),
              }}
            >
              Normal
            </div>
            <div
              onClick={() => this.difficultyToggle('experienced')}
              style={{
                ...styles.toggle,
                ...(this.state.selectedDifficulty === 'experienced' ? styles.selectedToggle : {}),
              }}
            >
              Hard
            </div>
            <div style={styles.difficultyDescription}>
              <span>
                {this.state.selectedDifficulty === 'standard'
                  ? 'Standard difficulty. Good for players of all experience levels to Imperial Assault. Threat gained per round is standard campaign rules. HP buffs for units is standard.'
                  : ''}
              </span>
              <span>
                {this.state.selectedDifficulty === 'experienced'
                  ? 'Hard difficulty. Good for players looking for a challenge. Threat gained per round is increased. HP buffs for units is increased.'
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderSelectExpansions() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Expansions</span>
        </div>
        <div style={styles.sectionContentsNoFlex}>
          <div style={styles.sectionDescription}>
            Select expansions to use. Expansions will add units to be used for deployment.
          </div>
          <div style={styles.toggleSection}>
            <div>
              <input type="checkbox" id="twinShadows" />
              <label style={styles.label} htmlFor="twinShadows">
                Twin Shadows
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderSelectImperialRewards() {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Imperial Rewards</span>
        </div>
        <div style={styles.sectionContentsNoFlex}>
          <div style={styles.sectionDescription}>
            Select the rewards that the Imperial Player has earned. They will be activated when the
            mission starts.
          </div>
          <div style={styles.toggleSection}>
            <div>
              <input type="checkbox" id="imperialIndustry" />
              <label style={styles.label} htmlFor="imperialIndustry">
                Imperial Industry
              </label>
            </div>
            <div>
              <input type="checkbox" id="oldWounds" />
              <label style={styles.label} htmlFor="oldWounds">
                Old Wounds
              </label>
            </div>
            <div>
              <input type="checkbox" id="specialOperations" />
              <label style={styles.label} htmlFor="specialOperations">
                Special Operations
              </label>
            </div>
            <div>
              <input type="checkbox" id="supplyDeficit" />
              <label style={styles.label} htmlFor="supplyDeficit">
                Supply Deficit
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Router>
        <div style={styles.base}>
          {this.renderSelectMission()}
          {this.renderSelectExpansions()}
          {this.renderSelectHeroes()}
          {this.renderSelectAlly()}
          {this.renderSelectVillains()}
          {this.renderSelectImperialRewards()}
          <div style={styles.buttonSection}>
            <Button text="Cancel" onClick={this.cancel} style={styles.cancelButton} />
            <Button text="Start" onClick={this.submit} />
          </div>
        </div>
      </Router>
    );
  }
}

export default CharacterSelection;
