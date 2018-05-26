// @flow

import Circle from '../Circle';
import handleTextSubs from '../utils/handleTextSubs';
import Modal from '../Modal';
import React from 'react';
import units from '../../data/units.json';

const styles = {
  black: {
    backgroundColor: 'black',
  },
  blue: {
    backgroundColor: 'rgb(24, 168, 198)',
  },
  circle: {
    alignItems: 'center',
    border: '3px solid white',
    borderRadius: '23px',
    color: 'white',
    display: 'flex',
    height: '40px',
    justifyContent: 'center',
    margin: '0 5px',
    width: '40px',
  },
  circleContainer: {
    cursor: 'pointer',
  },
  colorRow: {
    display: 'flex',
    flexDirection: 'row',
    margin: '10px 0',
  },
  contents: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '15px',
  },
  purple: {
    backgroundColor: 'rgb(169, 56, 109)',
  },
  red: {
    backgroundColor: 'rgb(239, 50, 39)',
  },
  selected: {
    border: '3px solid black',
  },
  title: {
    fontSize: '14px',
    marginBottom: '15px',
    textAlign: 'center',
  },
};

type DeployGroupInteractiveModalPropsType = {
  closeModals: Function,
  deployGroupInteractiveModalAnswer: Function,
  group: string,
  location: string,
  title: string,
  type: string,
};

type DeployGroupInteractiveModalStateType = {
  color: string,
  number: number,
};

class DeployGroupInteractiveModal extends React.Component<
  DeployGroupInteractiveModalPropsType,
  DeployGroupInteractiveModalStateType
> {
  state = {
    color: '',
    number: 0,
  };

  handleButtonClick = () => {
    const {color, number} = this.state;
    this.props.closeModals(this.props.type);
    this.props.deployGroupInteractiveModalAnswer(color, number);
    this.setState({color: '', number: 0});
  };

  handleCircleClick = (color: string, number: number) => {
    this.setState({color, number});
  };

  isSelected = (color: string, number: number) => {
    return this.state.color === color && this.state.number === number;
  };

  render() {
    const group = units[this.props.group];
    return (
      <Modal
        buttonText={'OK'}
        displayCancel={false}
        handleButtonClick={this.handleButtonClick}
        title={`${this.props.title} - Deploying ${group.name}`}
      >
        <div style={styles.contents}>
          <div style={styles.title}>
            <span>{'Choose a color and number for: '}</span>
            <span style={{fontWeight: 'bold'}}>{group.name}</span>
          </div>
          <div style={styles.title} dangerouslySetInnerHTML={{__html: handleTextSubs(this.props.location)}} />
          <div style={styles.colorRow}>
            {[1, 2, 3, 4, 5].map((n: number) => (
              <div key={`red-${n}`} style={styles.circleContainer}>
                <Circle
                  color={'red'}
                  handleClick={this.handleCircleClick}
                  isSelected={this.isSelected('red', n)}
                  number={n}
                />
              </div>
            ))}
          </div>
          <div style={styles.colorRow}>
            {[1, 2, 3, 4, 5].map((n: number) => (
              <div key={`purple-${n}`} style={styles.circleContainer}>
                <Circle
                  color={'purple'}
                  handleClick={this.handleCircleClick}
                  isSelected={this.isSelected('purple', n)}
                  number={n}
                />
              </div>
            ))}
          </div>
          <div style={styles.colorRow}>
            {[1, 2, 3, 4, 5].map((n: number) => (
              <div key={`black-${n}`} style={styles.circleContainer}>
                <Circle
                  color={'black'}
                  handleClick={this.handleCircleClick}
                  isSelected={this.isSelected('black', n)}
                  number={n}
                />
              </div>
            ))}
          </div>
          <div style={styles.colorRow}>
            {[1, 2, 3, 4, 5].map((n: number) => (
              <div key={`blue-${n}`} style={styles.circleContainer}>
                <Circle
                  color={'blue'}
                  handleClick={this.handleCircleClick}
                  isSelected={this.isSelected('blue', n)}
                  number={n}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }
}

export default DeployGroupInteractiveModal;
