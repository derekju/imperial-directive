// @flow

import {LIGHT_WHITE, SUCCESS_GREEN} from '../styles/colors';
import {BrowserRouter as Router} from 'react-router-dom';
import Button from './Button';
import HeroAvatar from './HeroAvatar';
import missions from '../data/missions.json';
import React from 'react';
import rebels from '../data/rebels.json';

const styles = {
  avatarContainer: {
    cursor: 'pointer',
    padding: '10px',
  },
  base: {
    alignItems: 'center',
    backgroundColor: LIGHT_WHITE,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-around',
  },
  cancelButton: {
    marginRight: '10px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '150px',
  },
  section: {
    width: '800px',
  },
  sectionContents: {
    border: '2px solid black',
    borderTop: 'none',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '20px',
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
    border: `3px solid ${SUCCESS_GREEN}`,
  },
  threatButton: {
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginRight: '10px',
  },
};

type CharacterSelectionPropsType = {
  availableHeroes: string[],
  availableMissions: string[],
  history: Object,
  setMission: Function,
  setMissionThreat: Function,
  setRoster: Function,
};

type CharacterSelectionStateType = {
  missionThreat: number,
  selectedRoster: string[],
};

class CharacterSelection extends React.Component<
  CharacterSelectionPropsType,
  CharacterSelectionStateType
> {
  select: ?HTMLSelectElement;

  state = {
    missionThreat: 2,
    selectedRoster: [],
  };

  cancel = () => {
    this.props.history.goBack();
  };

  submit = () => {
    this.props.setRoster(this.state.selectedRoster);
    this.props.setMissionThreat(this.state.missionThreat);
    if (this.select) {
      const selectedMission = this.select.options[this.select.selectedIndex].value;
      this.props.setMission(selectedMission);
    }
    this.props.history.push('/mission');
  };

  handleAvatarClick = (heroId: string) => {
    if (this.state.selectedRoster.includes(heroId)) {
      this.setState((prevState: CharacterSelectionStateType) => ({
        selectedRoster: prevState.selectedRoster.filter((id: string) => id !== heroId),
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

  render() {
    return (
      <Router>
        <div style={styles.base}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.headerText}>Select Mission</span>
            </div>
            <div style={styles.sectionContents}>
              <select ref={this.saveSelect} style={styles.selectInput}>
                {this.props.availableMissions.map((missionId: string) => (
                  <option key={missionId} value={missionId}>
                    {missions[missionId].name}
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
          <div>
            <Button text="Cancel" onClick={this.cancel} style={styles.cancelButton} />
            <Button text="OK" onClick={this.submit} />
          </div>
        </div>
      </Router>
    );
  }
}

export default CharacterSelection;
