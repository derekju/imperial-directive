// @flow

import Door from './map/Door';
import find from 'lodash/find';
import type {MapStateType} from '../reducers/mission';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';
import Terminal from './map/Terminal';

const styles = {
  base: {
    flex: 1,
    position: 'relative',
  },
  block: {
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid black',
    display: 'flex',
    height: '45px',
    justifyContent: 'center',
    margin: '1px',
    width: '45px',
  },
  emptyBlock: {
    height: '47px',
    margin: '1px',
    width: '47px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '100px',
  },
  mapContents: {
    ...positionAbsolute(25, 0, 0, 0),
    alignItems: 'center',
    backgroundColor: '#EEE',
    border: '2px solid black',
    display: 'flex',
    justifyContent: 'center',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
};

type MapPropsType = {
  displayModal: Function,
  mapImage: Array<Array<number>>,
  mapStates: {[key: string]: MapStateType},
};

class Map extends React.Component<MapPropsType> {
  renderMapState = (row: number, column: number) => {
    const mapState = find(
      this.props.mapStates,
      (ms: MapStateType) => ms.coordinates.x === column && ms.coordinates.y === row
    );

    if (mapState) {
      if (mapState.type === 'terminal') {
        return (
          <Terminal
            activated={mapState.activated}
            id={mapState.id}
            displayModal={this.props.displayModal}
            type={mapState.type}
          />
        );
      } else if (mapState.type === 'door') {
        return (
          <Door
            activated={mapState.activated}
            id={mapState.id}
            displayModal={this.props.displayModal}
            type={mapState.type}
          />
        );
      }
    }

    return null;
  };

  renderMap() {
    return (
      <div>
        {this.props.mapImage.map((row: number[], rowIndex: number) => (
          <div key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell: number, cellIndex: number) => {
              if (cell === 1) {
                return (
                  <div key={`${rowIndex}-${cellIndex}`} style={styles.block}>
                    {this.renderMapState(rowIndex, cellIndex)}
                  </div>
                );
              } else {
                return <div key={`${rowIndex}-${cellIndex}`} style={styles.emptyBlock} />;
              }
            })}
          </div>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.base}>
        <div>
          <span style={styles.headerText}>Map</span>
        </div>
        <div style={styles.mapContents}>{this.renderMap()}</div>
      </div>
    );
  }
}

export default Map;
