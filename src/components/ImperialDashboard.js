// @flow

import AiCard from './AiCard';
import type {ImperialUnitType} from '../reducers/imperials';
import React from 'react';
import ImperialAvatar from './ImperialAvatar';

const styles = {
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
  activatedGroups: ImperialUnitType[],
  exhaustedGroups: ImperialUnitType[],
  readyGroups: ImperialUnitType[],
  setImperialGroupActivated: Function,
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
              <ImperialAvatar
                imperialUnit={imperialUnit}
                key={`${imperialUnit.id}-${imperialUnit.groupNumber}`}
              />
            ))}
          </div>
        </div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Activated</span>
          </div>
          <div style={styles.sectionContents}>
            {this.props.activatedGroups.map((imperialUnit: ImperialUnitType) => (
              <div key={`${imperialUnit.id}-${imperialUnit.groupNumber}`} style={{display: 'flex', flexDirection: 'row'}}>
                <ImperialAvatar
                  imperialUnit={imperialUnit}
                  key={imperialUnit.id}
                  setImperialGroupActivated={this.props.setImperialGroupActivated}
                />
                <AiCard {...imperialUnit} />
              </div>
            ))}
          </div>
        </div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Exhausted</span>
          </div>
          <div style={styles.sectionContents}>
            {this.props.exhaustedGroups.map((imperialUnit: ImperialUnitType) => (
              <ImperialAvatar
                imperialUnit={imperialUnit}
                key={`${imperialUnit.id}-${imperialUnit.groupNumber}`}
              />
            ))}
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
