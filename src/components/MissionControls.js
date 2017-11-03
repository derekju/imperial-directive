// @flow

import Button from './Button';
import React from 'react';

type MissionControlsPropsType = {
  handleEndTurnClick: Function,
};

class MissionControls extends React.Component<MissionControlsPropsType> {
  render() {
    return (
      <div>
        <Button text="END TURN" onClick={this.props.handleEndTurnClick} />
      </div>
    );
  }
}

export default MissionControls;
