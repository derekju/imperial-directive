// @flow

import EventsPanel from './EventsPanel';
import HeroPanelContainer from '../containers/HeroPanelContainer';
import ImperialDashboardContainer from '../containers/ImperialDashboardContainer';
import {LIGHT_GRAY_TRANSPARENT} from '../styles/colors';
import MilestonesPanel from './MilestonesPanel';
import MissionPanel from './MissionPanel';
import ModalManagerContainer from '../containers/ModalManagerContainer';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import RoundThreatTracker from './RoundThreatTracker';

const styles = {
  base: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    height: '768px',
    width: '1024px',
  },
  contents: {
    margin: '10px 0 10px 10px',
    width: '654px',
  },
  leftPanelContainer: {
    margin: '10px 0 0 10px',
    width: '124px',
  },
  missionControlContainer: {
    ...positionAbsolute(null, 10, 10, null),
  },
  modalContainer: {
    ...positionAbsolute(0, 0, 0, 0),
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY_TRANSPARENT,
    display: 'flex',
    justifyContent: 'center',
  },
  panelItem: {
    marginBottom: '10px',
  },
  rightPanelContainer: {
    margin: '10px 0 0 10px',
    width: '204px',
  },
};

type MissionPropsType = {
  currentMission: string,
  currentRound: number,
  currentThreat: number,
  displayModal: boolean,
};

class Mission extends React.Component<MissionPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <div style={styles.leftPanelContainer}>
          <div style={styles.panelItem}>
            <RoundThreatTracker round={this.props.currentRound} threat={this.props.currentThreat} />
          </div>
          <div style={styles.panelItem}>
            <HeroPanelContainer />
          </div>
        </div>
        <div style={styles.contents}>
          <ImperialDashboardContainer />
        </div>
        <div style={styles.rightPanelContainer}>
          <div style={styles.panelItem}>
            <MissionPanel currentMission={this.props.currentMission} />
          </div>
          <div style={styles.panelItem}>
            <MilestonesPanel />
          </div>
          <div style={styles.panelItem}>
            <EventsPanel />
          </div>
        </div>
        {this.props.displayModal ? (
          <div style={styles.modalContainer}>
            <ModalManagerContainer />
          </div>
        ) : null}
      </div>
    );
  }
}

export default Mission;
