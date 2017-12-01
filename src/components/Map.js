// @flow

import filter from 'lodash/filter';
import MapObject from './map/MapObject';
import type {MapStateType} from '../reducers/mission';
import noop from 'lodash/noop';
import {positionAbsolute} from '../styles/mixins';
import React from 'react';

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
    position: 'relative',
    width: '45px',
  },
  emptyBlock: {
    height: '47px',
    margin: '1px',
    width: '47px',
  },
  extraPadding: {
    height: '10px',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '100px',
  },
  impassableBlock: {
    backgroundColor: 'rgba(255, 0, 0, 0.25)',
    border: '1px solid red',
  },
  mapContents: {
    ...positionAbsolute(25, 0, 0, 0),
    WebkitOverflowScrolling: 'touch',
    backgroundColor: '#EEE',
    border: '2px solid black',
    display: 'flex',
    overflow: 'scroll',
  },
  mapInner: {
    margin: '0 auto',
    padding: '10px 10px 0 10px',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
};

type MapPropsType = {
  displayModal: Function,
  mapImage: Array<Array<string>>,
  mapStates: {[key: string]: MapStateType},
};

class Map extends React.Component<MapPropsType> {
  renderMapState = (row: number, column: number) => {
    const mapStates = filter(
      this.props.mapStates,
      (ms: MapStateType) => ms.coordinates.x === column && ms.coordinates.y === row
    );

    return mapStates.map((mapState: MapStateType) => {
      if (mapState && mapState.visible) {
        return (
          <MapObject
            activated={mapState.activated}
            code={mapState.type[0].toUpperCase()}
            color={mapState.color || 'gray'}
            displayModal={mapState.interactable ? this.props.displayModal : noop}
            id={mapState.id}
            key={`${mapState.type}-${mapState.id}`}
            offset={mapState.offset || false}
            type={mapState.type}
          />
        );
      } else {
        return null;
      }
    });
  };

  renderMap() {
    return (
      <div style={styles.mapInner}>
        {this.props.mapImage.map((row: string[], rowIndex: number) => (
          <div key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell: string, cellIndex: number) => {
              const cellNumber = parseInt(cell, 10);
              if (cellNumber > 0) {
                const bgColor = Math.floor(255 - cellNumber * 5);
                const combinedStyles = {
                  ...styles.block,
                  backgroundColor: `rgb(255, ${bgColor}, ${bgColor})`,
                };
                return (
                  <div key={`${rowIndex}-${cellIndex}`} style={combinedStyles}>
                    {this.renderMapState(rowIndex, cellIndex)}
                  </div>
                );
              } else {
                return <div key={`${rowIndex}-${cellIndex}`} style={styles.emptyBlock} />;
              }
            })}
          </div>
        ))}
        <div style={styles.extraPadding} />
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
