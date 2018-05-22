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

const styles = {
  activatedGroupContainer: {
    ...positionAbsolute(25, 25, 25, 25),
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 100,
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
    position: 'relative',
    width: '665px',
  },
  leftPanelContainer: {
    margin: '10px 0 0 10px',
    width: '114px',
  },
  menuContainer: {
    ...positionAbsolute(null, 10, 10, null),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '204px',
  },
  modalContainer: {
    ...positionAbsolute(0, 0, 0, 0),
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY_TRANSPARENT,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },
  panelItem: {
    marginBottom: '10px',
  },
  quitButton: {
    marginRight: '10px',
  },
  rightPanelContainer: {
    margin: '10px 0 0 10px',
    width: '185px',
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
          <div style={styles.panelItem}>
            <MissionPanel
              currentMission={this.props.currentMissionName}
              instructions={this.props.instructions}
            />
          </div>
          <div style={styles.panelItem}>
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
