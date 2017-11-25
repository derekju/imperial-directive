// @flow

import React from 'react';

const styles = {
  base: {
    alignItems: 'center',
    backgroundColor: 'rgb(88, 186, 219)',
    border: '2px solid white',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    height: '25px',
    justifyContent: 'center',
    position: 'relative',
    width: '25px',
  },
};

class Entrance extends React.Component<{}> {
  render() {
    return (
      <div style={styles.base}>
        <span>E</span>
      </div>
    );
  }
}

export default Entrance;
