// @flow

import {BrowserRouter as Router} from 'react-router-dom';
import Button from './Button';
import HeroAvatar from './HeroAvatar';
import React from 'react';
import rebels from '../data/rebels.json';

const styles = {
  avatarContainer: {
    cursor: 'pointer',
    padding: '10px',
  },
  base: {
    alignItems: 'center',
    backgroundColor: '#eee',
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
  selected: {
    border: '3px solid green',
  },
};

type CharacterSelectionPropsType = {
  availableHeroes: string[],
  history: Object,
  setRoster: Function,
};

type CharacterSelectionStateType = {
  selectedRoster: string[],
};

class CharacterSelection extends React.Component<
  CharacterSelectionPropsType,
  CharacterSelectionStateType
> {
  state = {
    selectedRoster: [],
  };

  cancel = () => {
    this.props.history.goBack();
  };

  submit = () => {
    this.props.setRoster(this.state.selectedRoster);
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

  render() {
    return (
      <Router>
        <div style={styles.base}>
          <div>
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
