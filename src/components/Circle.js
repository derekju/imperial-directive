// @flow

import React from 'react';

const styles = {
  black: {
    backgroundColor: '#555555',
  },
  blue: {
    backgroundColor: 'rgb(24, 168, 198)',
  },
  circle: {
    borderColor: 'black',
    borderRadius: '23px',
    borderStyle: 'solid',
    borderWidth: '3px',
    color: 'white',
    display: 'inline-block',
    fontSize: '14px',
    height: '40px',
    lineHeight: '40px',
    margin: '0 5px',
    textAlign: 'center',
    width: '40px',
  },
  purple: {
    backgroundColor: 'rgb(169, 56, 109)',
  },
  red: {
    backgroundColor: 'rgb(239, 50, 39)',
  },
  selected: {
    borderColor: 'white',
  },
  small: {
    borderWidth: '2px',
    fontSize: '12px',
    height: '20px',
    lineHeight: '20px',
    width: '20px',
  },
};

type CirclePropsType = {
  color: string,
  handleClick: Function,
  isSelected: boolean,
  number: number,
  useSmallSize: boolean,
};

class Circle extends React.Component<CirclePropsType> {
  static defaultProps = {
    handleClick: () => {},
    isSelected: false,
    useSmallSize: false,
  };

  handleClick = () => {
    this.props.handleClick(this.props.color, this.props.number);
  };

  render() {
    return (
      <span
        style={{
          ...styles.circle,
          ...styles[this.props.color],
          ...(this.props.useSmallSize ? styles.small : {}),
          ...(this.props.isSelected ? styles.selected : {}),
        }}
        onClick={this.handleClick}
      >
        {this.props.number}
      </span>
    );
  }
}

export default Circle;
