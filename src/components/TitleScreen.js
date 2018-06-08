// @flow

import {BrowserRouter as Router} from 'react-router-dom';
import Button from './Button';
import {LIGHT_WHITE} from '../styles/colors';
import React from 'react';

const styles = {
  about: {
    fontSize: '10px',
    textAlign: 'center',
  },
  base: {
    alignItems: 'center',
    backgroundColor: LIGHT_WHITE,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  button: {
    marginBottom: '10px',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
};

type TitleScreenPropsType = {
  history: Object,
  resumeMissionAvailable: boolean,
};

class TitleScreen extends React.Component<TitleScreenPropsType> {
  startMission = () => {
    this.props.history.push('/character_selection');
  };

  resumeMission = () => {
    this.props.history.push('/mission');
  };

  render() {
    return (
      <Router>
        <div style={styles.base}>
          <pre>
            {
              '██████████████████████████████████████████████████████████████████████████████████████\n'
            }
            {'      __  .___  ___. .______    _______ .______       __       ___       __\n'}
            {'     |  | |   \\/   | |   _  \\  |   ____||   _  \\     |  |     /   \\     |  |\n'}
            {'     |  | |  \\  /  | |  |_)  | |  |__   |  |_)  |    |  |    /  ^  \\    |  |\n'}
            {'     |  | |  |\\/|  | |   ___/  |   __|  |      /     |  |   /  /_\\  \\   |  |\n'}
            {
              '     |  | |  |  |  | |  |      |  |____ |  |\\  \\----.|  |  /  _____  \\  |  `----.\n'
            }
            {
              '     |__| |__|  |__| | _|      |_______|| _| `._____||__| /__/     \\__\\ |_______|\n'
            }
            {'\n'}
            {
              ' _______   __  .______       _______   ______ .___________. __  ____    ____  _______\n'
            }
            {
              '|       \\ |  | |   _  \\     |   ____| /      ||           ||  | \\   \\  /   / |   ____|\n'
            }
            {
              "|  .--.  ||  | |  |_)  |    |  |__   |  ,-----'---|  |----`|  |  \\   \\/   /  |  |__\n"
            }
            {
              '|  |  |  ||  | |      /     |   __|  |  |         |  |     |  |   \\      /   |   __|\n'
            }
            {
              "|  '--'  ||  | |  |\\  \\----.|  |____ |  `----.    |  |     |  |    \\    /    |  |____\n"
            }
            {
              '|_______/ |__| | _| `._____||_______| \\______|    |__|     |__|     \\__/     |_______|\n'
            }
            {'\n'}
            {
              '██████████████████████████████████████████████████████████████████████████████████████\n'
            }
          </pre>
          <div style={styles.buttonContainer}>
            <Button style={styles.button} text="New Mission" onClick={this.startMission} />
            {this.props.resumeMissionAvailable ? (
              <Button style={styles.button} text="Resume Mission" onClick={this.resumeMission} />
            ) : null}
          </div>
          <div style={styles.about}>
            <div>
              Imperial Assault is trademarked and copyrighted by Fantasy Flight Games and I make no
              claims of ownership. FFG does not endorse, support, or is involved with this site in
              any way.
            </div>
            <div>
              Special thanks to Redjak for his automated variants that served as inspiration for
              this variant.
            </div>
            <div>Created by Derek Ju.</div>
          </div>
        </div>
      </Router>
    );
  }
}

export default TitleScreen;
