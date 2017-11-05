// @flow

import EventsPanel from './EventsPanel';
import HeroPanelContainer from '../containers/HeroPanelContainer';
import ImperialDashboardContainer from '../containers/ImperialDashboardContainer';
import {LIGHT_GRAY_TRANSPARENT} from '../styles/colors';
import MilestonesPanel from './MilestonesPanel';
import MissionPanel from './MissionPanel';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import RoundThreatTracker from './RoundThreatTracker';

const styles = {
  contents: {
    ...positionAbsolute(10, 225, 10, 145),
  },
  leftPanelContainer: {
    ...positionAbsolute(10, null, 10, 10),
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
    ...positionAbsolute(10, 10, 10, null),
  },
};

type MissionPropsType = {
  currentRound: number,
  currentThreat: number,
  missionStep: number,
};

class Mission extends React.Component<MissionPropsType> {
  render() {
    return (
      <div>
        <div style={styles.leftPanelContainer}>
          <div style={styles.panelItem}>
            <RoundThreatTracker round={this.props.currentRound} threat={this.props.currentThreat} />
          </div>
          <div style={styles.panelItem}>
            <HeroPanelContainer />
          </div>
        </div>
        <div style={styles.rightPanelContainer}>
          <div style={styles.panelItem}>
            <MissionPanel />
          </div>
          <div style={styles.panelItem}>
            <MilestonesPanel />
          </div>
          <div style={styles.panelItem}>
            <EventsPanel />
          </div>
        </div>
        <div style={styles.contents}>
          <ImperialDashboardContainer />
        </div>
      </div>
    );
  }
}

/*
<AiPanel />
*/
/*
        <div style={styles.modalContainer}>
          <Modal buttonText="Next" title="Setup Mission" text="Setup mission according to campaign guide" />
        </div>
*/

export default Mission;
