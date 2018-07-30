// @flow

import {ELITE_RED} from '../../styles/colors';
import {positionAbsolute} from '../../styles/mixins';
import React from 'react';

const styles = {
  activated: {
    opacity: 0.25,
  },
  base: {
    alignItems: 'center',
    border: '2px solid black',
    cursor: 'pointer',
    display: 'flex',
    height: '30px',
    justifyContent: 'center',
    width: '30px',
  },
  blue: {
    backgroundColor: 'rgb(34, 65, 123)',
    border: '2px solid white',
    color: 'white',
  },
  door: {
    backgroundColor: 'black',
    border: '2px solid white',
    color: 'white',
  },
  entrance: {
    backgroundColor: 'rgb(88, 186, 219)',
    border: '2px solid white',
    color: 'white',
  },
  gray: {
    backgroundColor: '#DDD',
    color: 'black',
  },
  green: {
    backgroundColor: 'rgb(142, 184, 97)',
    color: 'white',
  },
  offset: {
    ...positionAbsolute(32, null, null, 32),
    zIndex: 1,
  },
  red: {
    backgroundColor: ELITE_RED,
    color: 'white',
  },
  yellow: {
    backgroundColor: 'rgb(214, 193, 131)',
    color: 'black',
  },
};

type MapObjectPropsType = {
  activated: boolean,
  code: string,
  color: string,
  displayModal: Function,
  id: number,
  offset: boolean,
  type: string,
};

class MapObject extends React.Component<MapObjectPropsType> {
  handleClick = () => {
    this.props.displayModal('INTERACT_OBJECT', {id: this.props.id, type: this.props.type});
  };

  render() {
    const combinedStyles = {
      ...styles.base,
      ...(this.props.activated ? styles.activated : {}),
      ...styles[this.props.color],
      ...(this.props.offset ? styles.offset : {}),
      ...(this.props.type === 'door' ? styles.door : {}),
      ...(this.props.type === 'entrance' ? styles.entrance : {}),
    };

    return (
      <div style={combinedStyles} onClick={this.handleClick}>
        <span>{`${this.props.code}${this.props.id}`}</span>
      </div>
    );
  }
}

export default MapObject;
