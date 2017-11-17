// @flow

import AiCard from './AiCard';
import HeroPanelContainer from '../containers/HeroPanelContainer';
import ImperialDashboardContainer from '../containers/ImperialDashboardContainer';
import type {ImperialUnitType} from '../reducers/imperials';
import {LIGHT_GRAY_TRANSPARENT} from '../styles/colors';
import MapContainer from '../containers/MapContainer';
import MissionPanel from './MissionPanel';
import ModalManagerContainer from '../containers/ModalManagerContainer';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import RoundThreatTracker from './RoundThreatTracker';

const styles = {
  activatedGroupContainer: {
    ...positionAbsolute(100, 200, 100, 200),
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  base: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
  },
  contents: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
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
  activatedGroup: ?ImperialUnitType,
  currentMission: string,
  currentRound: number,
  currentThreat: number,
  displayModal: boolean,
  instructions: {imperialVictory: string, rebelVictory: string},
  priorityTarget: string,
  setImperialGroupActivated: Function,
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
          <MapContainer />
        </div>
        <div style={styles.rightPanelContainer}>
          <div style={styles.panelItem}>
            <MissionPanel
              currentMission={this.props.currentMission}
              instructions={this.props.instructions}
            />
          </div>
        </div>
        {this.props.activatedGroup ? (
          <div style={styles.activatedGroupContainer}>
            <AiCard
              group={this.props.activatedGroup}
              priorityTarget={this.props.priorityTarget}
              setImperialGroupActivated={this.props.setImperialGroupActivated}
            />
          </div>
        ) : null}
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
