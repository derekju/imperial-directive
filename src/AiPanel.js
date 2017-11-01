import AiCard from './AiCard';
import React from 'react';
import Units from './data/units.json';

const styles = {
  base: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
};

class AiPanel extends React.Component {
  render() {
    return (
      <div style={styles.base}>
        <AiCard {...Units.stormtrooper} />
        <AiCard {...Units.stormtrooper} elite={true} />
        <AiCard {...Units.imperialOfficer} />
        <AiCard {...Units.imperialOfficer} elite={true} />
      </div>
    );
  }
}

export default AiPanel;
