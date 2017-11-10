// @flow

import React from 'react';
import StatusReinforcementContainer from '../containers/StatusReinforcementContainer';

const styles = {
  base: {},
};

type ModalManagerPropsType = {
  type: string,
};

class ModalManager extends React.Component<ModalManagerPropsType> {
  render() {
    return (
      <div style={styles.base}>
        <StatusReinforcementContainer />
      </div>
    );
  }
}

export default ModalManager;
