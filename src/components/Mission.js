// @flow

import AiPanel from '../AiPanel';
import {LIGHT_GRAY_TRANSPARENT} from '../styles/colors';
import MissionControls from '../MissionControls';
import MilestonesPanel from '../MilestonesPanel';
import MissionPanel from '../MissionPanel';
import Modal from '../Modal';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import UnitPanel from '../UnitPanel';

const styles = {
  contents: {
    position: 'absolute',
    top: '20px',
    bottom: '20px',
    left: '20px',
    right: '250px',
    display: 'flex',
    flexDirection: 'row',
  },
  missionControlContainer: {
    position: 'absolute',
    right: '20px',
    bottom: '20px',
  },
  missionPanelContainer: {
    position: 'absolute',
    top: '20px',
    right: '20px',
  },
  modalContainer: {
    ...positionAbsolute(0, 0, 0, 0),
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY_TRANSPARENT,
    display: 'flex',
    justifyContent: 'center',
  },
  unitPanelContainer: {
    alignSelf: 'center',
    marginRight: '20px',
  },
};

type MissionPropsType = {
  missionStep: number,
};

class Mission extends React.Component {
  props: MissionPropsType;

  render() {
    console.log(this.props.missionStep);
    return (
      <div>
        <div style={styles.missionPanelContainer}>
          <MissionPanel />
        </div>
        <div style={styles.contents}>
          <div style={styles.unitPanelContainer}>
            <UnitPanel />
          </div>
          <MilestonesPanel />
        </div>
        <div style={styles.missionControlContainer}>
          <MissionControls />
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
