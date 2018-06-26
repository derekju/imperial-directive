// @flow

import AiCard from './AiCard';
import Button from './Button';
import {CURRENT_MISSION_KEY} from '../constants';
import GoalPanelContainer from '../containers/GoalPanelContainer';
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

const RIGHT_PANEL_WIDTH = 240 + 4;

const styles = {
  activatedGroupContainer: {
    backgroundColor: 'transparent',
    bottom: '0%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    left: '15%',
    position: 'absolute',
    right: '15%',
    top: '0%',
    zIndex: 100,
  },
  base: {
    backgroundColor: 'white',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  contents: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    margin: '10px 10px 10px 0',
  },
  flexContainer: {
    display: 'flex',
    flex: 1,
  },
  leftPanelContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '10px',
    width: '114px',
  },
  menuContainer: {
    ...positionAbsolute(null, 10, 10, null),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: `${RIGHT_PANEL_WIDTH}px`,
  },
  modalContainer: {
    ...positionAbsolute(0, 0, 0, 0),
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY_TRANSPARENT,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },
  quitButton: {
    marginRight: '10px',
  },
  rightPanelContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '10px 10px 60px 0',
    width: `${RIGHT_PANEL_WIDTH}px`,
  },
  rightPanelItem: {
    marginBottom: '10px',
  },
  roundThreatTracker: {
    height: '35px',
    marginBottom: '10px',
  },
};

type MissionPropsType = {
  activatedGroup: ?ImperialUnitType,
  attackTarget: string,
  currentMission: string,
  currentMissionName: string,
  currentRound: number,
  currentThreat: number,
  customAI: ?(Object[]),
  customAIExceptionList: string[],
  customUnitAI: {[string]: Object[]},
  displayModal: boolean,
  history: Object,
  instructions: {imperialVictory: string, rebelVictory: string},
  interruptedGroup: ?ImperialUnitType,
  moveTarget: string,
  rewardImperialIndustryEarned: boolean,
  setImperialGroupActivated: Function,
  setInterruptedGroupActivated: Function,
};

class Mission extends React.Component<MissionPropsType> {
  handleQuit = () => {
    window.localStorage.setItem(CURRENT_MISSION_KEY, '');
    window.location.href = '/';
  };

  render() {
    return (
      <div style={styles.base}>
        <div style={styles.leftPanelContainer}>
          <div style={styles.roundThreatTracker}>
            <RoundThreatTracker round={this.props.currentRound} threat={this.props.currentThreat} />
          </div>
          <div style={styles.flexContainer}>
            <HeroPanelContainer />
          </div>
        </div>
        <div style={styles.contents}>
          <ImperialDashboardContainer />
          <MapContainer />
          {this.props.activatedGroup ? (
            <div style={styles.activatedGroupContainer}>
              <AiCard
                attackTarget={this.props.attackTarget}
                customAI={this.props.customAI}
                customAIExceptionList={this.props.customAIExceptionList}
                customUnitAI={this.props.customUnitAI}
                group={this.props.activatedGroup}
                moveTarget={this.props.moveTarget}
                rewardImperialIndustryEarned={this.props.rewardImperialIndustryEarned}
                setImperialGroupActivated={this.props.setImperialGroupActivated}
              />
            </div>
          ) : null}
          {this.props.interruptedGroup ? (
            <div style={styles.activatedGroupContainer}>
              <AiCard
                attackTarget={this.props.attackTarget}
                customAI={this.props.customAI}
                customAIExceptionList={this.props.customAIExceptionList}
                customUnitAI={this.props.customUnitAI}
                group={this.props.interruptedGroup}
                moveTarget={this.props.moveTarget}
                rewardImperialIndustryEarned={this.props.rewardImperialIndustryEarned}
                setImperialGroupActivated={this.props.setInterruptedGroupActivated}
              />
            </div>
          ) : null}
        </div>
        <div style={styles.rightPanelContainer}>
          <div style={styles.rightPanelItem}>
            <MissionPanel
              currentMission={this.props.currentMissionName}
              instructions={this.props.instructions}
            />
          </div>
          <div style={styles.flexContainer}>
            <GoalPanelContainer />
          </div>
        </div>
        <div style={styles.menuContainer}>
          <Button style={styles.quitButton} onClick={this.handleQuit} text="Quit" width={80} />
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
