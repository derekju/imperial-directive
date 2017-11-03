// @flow

import AiCard from './AiCard';
import type {ImperialUnitType} from '../reducers/imperials';
import React from 'react';
import UnitAvatar from './UnitAvatar';
import Units from '../data/units.json';

const styles = {
  avatar: {
    marginRight: '20px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '100px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionContents: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionHeader: {
    borderBottom: '2px solid black',
    marginBottom: '15px',
  },
};

type ImperialDashboardPropsType = {
  readyGroups: ImperialUnitType[],
};

class ImperialDashboard extends React.Component<ImperialDashboardPropsType> {
  render() {
    return (
      <div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Ready</span>
          </div>
          <div style={styles.sectionContents}>
            {this.props.readyGroups.map((imperialUnit: ImperialUnitType) => (
              <UnitAvatar
                displayFullName={true}
                elite={imperialUnit.elite}
                firstName={imperialUnit.firstName}
                id={imperialUnit.id}
                key={imperialUnit.id}
                lastName={imperialUnit.lastName}
                style={styles.avatar}
              />
            ))}
          </div>
        </div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Activated</span>
          </div>
          <div style={styles.sectionContents} />
        </div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Exhausted</span>
          </div>
        </div>
      </div>
    );
  }
}

/*
        <AiCard {...Units.stormtrooper} />
        <AiCard {...Units.stormtrooper} elite={true} />
        <AiCard {...Units.imperialOfficer} />
        <AiCard {...Units.imperialOfficer} elite={true} />
*/

export default ImperialDashboard;
