// @flow

import {BrowserRouter as Router, Route} from 'react-router-dom';
import Button from './Button';
import React from 'react';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-around',
  },
  menuContainer: {
    //marginTop: '50px',
  },
};

type TitleScreenPropsType = {
  history: Object;
};

class TitleScreen extends React.Component<TitleScreenPropsType> {

  startCampaign = () => {
    this.props.history.push('/mission');
  }

  render() {
    return (
      <Router>
        <div style={styles.base}>
          <pre>
{'██████████████████████████████████████████████████████████████████████████████████████\n'}
{'      __  .___  ___. .______    _______ .______       __       ___       __\n'}
{'     |  | |   \\/   | |   _  \\  |   ____||   _  \\     |  |     /   \\     |  |\n'}
{'     |  | |  \\  /  | |  |_)  | |  |__   |  |_)  |    |  |    /  ^  \\    |  |\n'}
{'     |  | |  |\\/|  | |   ___/  |   __|  |      /     |  |   /  /_\\  \\   |  |\n'}
{'     |  | |  |  |  | |  |      |  |____ |  |\\  \\----.|  |  /  _____  \\  |  `----.\n'}
{'     |__| |__|  |__| | _|      |_______|| _| `._____||__| /__/     \\__\\ |_______|\n'}
{'\n'}
{' _______   __  .______       _______   ______ .___________. __  ____    ____  _______\n'}
{'|       \\ |  | |   _  \\     |   ____| /      ||           ||  | \\   \\  /   / |   ____|\n'}
{"|  .--.  ||  | |  |_)  |    |  |__   |  ,-----'---|  |----`|  |  \\   \\/   /  |  |__\n"}
{'|  |  |  ||  | |      /     |   __|  |  |         |  |     |  |   \\      /   |   __|\n'}
{"|  '--'  ||  | |  |\\  \\----.|  |____ |  `----.    |  |     |  |    \\    /    |  |____\n"}
{'|_______/ |__| | _| `._____||_______| \\______|    |__|     |__|     \\__/     |_______|\n'}
{'\n'}
{'██████████████████████████████████████████████████████████████████████████████████████\n'}
          </pre>
          <div style={styles.menuContainer}>
            <Button text='New Campaign' onClick={this.startCampaign} />
          </div>
        </div>
      </Router>
    );
  }
}

export default TitleScreen;
