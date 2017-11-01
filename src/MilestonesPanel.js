import React from 'react';

const styles = {
  base: {
    border: '2px solid black',
    height: '200px',
    width: '200px',
  },
  contents: {
    padding: '5px',
  },
  header: {
    backgroundColor: 'black',
    color: 'white',
    padding: '5px',
  },
};

class MilestonesPanel extends React.Component {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.header}>Milestones</div>
        <div style={styles.contents}>
          <div>Terminal 1 destroyed</div>
          <div>Door open</div>
          <div>Terminal 2 destroyed</div>
          <div>Terminal 3 destroyed</div>
          <div>Terminal 4 destroyed</div>
        </div>
      </div>
    );
  }
}

export default MilestonesPanel;
