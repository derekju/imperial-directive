// @flow

import type {ImperialUnitType} from '../reducers/imperials';
import React from 'react';
import ImperialAvatar from './ImperialAvatar';

const styles = {
  base: {
    marginBottom: '20px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '100px',
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
  defeatImperialFigure: Function,
  deployedGroups: ImperialUnitType[],
  isImperialPlayerTurn: boolean,
  setImperialGroupActivated: Function,
};

class ImperialDashboard extends React.Component<ImperialDashboardPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.sectionHeader}>
          <span style={styles.headerText}>Ready</span>
        </div>
        <div style={styles.sectionContents}>
          {this.props.deployedGroups.map((imperialUnit: ImperialUnitType) => (
            <ImperialAvatar
              defeatImperialFigure={this.props.defeatImperialFigure}
              exhausted={imperialUnit.exhausted}
              imperialUnit={imperialUnit}
              isImperialPlayerTurn={this.props.isImperialPlayerTurn}
              key={`${imperialUnit.id}-${imperialUnit.groupNumber}`}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default ImperialDashboard;
