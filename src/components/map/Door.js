// @flow

import React from 'react';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    border: '2px solid black',
    color: 'black',
    cursor: 'pointer',
    display: 'flex',
    height: '25px',
    justifyContent: 'center',
    position: 'relative',
    width: '25px',
  },
};

type DoorPropsType = {
  id: string,
};

class Door extends React.Component<DoorPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <span>{`D${this.props.id}`}</span>
      </div>
    );
  }
}

export default Door;
