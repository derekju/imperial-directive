// @flow

import AiCard from './AiCard';
import type {ImperialUnitType} from '../reducers/imperials';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import ImperialAvatar from './ImperialAvatar';

const styles = {
  activatedGroupContainer: {
    ...positionAbsolute(100, 50, 100, 50),
    backgroundColor: 'white',
  },
  base: {
    height: '100%',
    position: 'relative',
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
  activatedGroup: ?ImperialUnitType,
  defeatImperialFigure: Function,
  exhaustedGroups: ImperialUnitType[],
  isImperialPlayerTurn: boolean,
  readyGroups: ImperialUnitType[],
  setImperialGroupActivated: Function,
};

class ImperialDashboard extends React.Component<ImperialDashboardPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Ready</span>
          </div>
          <div style={styles.sectionContents}>
            {this.props.readyGroups.map((imperialUnit: ImperialUnitType) => (
              <ImperialAvatar
                defeatImperialFigure={this.props.defeatImperialFigure}
                imperialUnit={imperialUnit}
                isImperialPlayerTurn={this.props.isImperialPlayerTurn}
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
            {this.props.activatedGroup ? (
              <div style={{display: 'flex', flexDirection: 'row'}}>
                <ImperialAvatar
                  defeatImperialFigure={this.props.defeatImperialFigure}
                  imperialUnit={this.props.activatedGroup}
                  isImperialPlayerTurn={this.props.isImperialPlayerTurn}
                  key={this.props.activatedGroup.id}
                  setImperialGroupActivated={this.props.setImperialGroupActivated}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.headerText}>Exhausted</span>
          </div>
          <div style={styles.sectionContents}>
            {this.props.exhaustedGroups.map((imperialUnit: ImperialUnitType) => (
              <ImperialAvatar
                defeatImperialFigure={this.props.defeatImperialFigure}
                imperialUnit={imperialUnit}
                isImperialPlayerTurn={this.props.isImperialPlayerTurn}
                key={`${imperialUnit.id}-${imperialUnit.groupNumber}`}
              />
            ))}
          </div>
        </div>
        {this.props.activatedGroup ? (
          <div style={styles.activatedGroupContainer}>
            <AiCard group={this.props.activatedGroup} setImperialGroupActivated={this.props.setImperialGroupActivated} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default ImperialDashboard;
