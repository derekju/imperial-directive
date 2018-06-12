// @flow

import type {ImperialUnitType} from '../reducers/imperials';
import React from 'react';
import ImperialAvatar from './ImperialAvatar';

const styles = {
  avatarWrapper: {
    paddingRight: '20px',
  },
  base: {
    marginBottom: '10px',
    position: 'relative',
  },
  headerText: {
    backgroundColor: 'black',
    color: 'white',
    display: 'block',
    padding: '5px 5px 2px 5px',
    width: '100px',
  },
  sectionContents: {
    WebkitOverflowScrolling: 'touch',
    border: '2px solid black',
    display: 'flex',
    flexDirection: 'row',
    height: '160px',
    overflowX: 'scroll',
    overflowY: 'hidden',
    padding: '10px 10px 0',
  },
};

type ImperialDashboardPropsType = {
  activateImperialGroup: Function,
  defeatImperialFigure: Function,
  deployedGroups: ImperialUnitType[],
  isImperialPlayerTurn: boolean,
};

type ImperialDashboardStateType = {
  htmlDivSectionContents: ?HTMLDivElement,
};

class ImperialDashboard extends React.Component<
  ImperialDashboardPropsType,
  ImperialDashboardStateType
> {
  htmlDivSectionContents: ?HTMLDivElement;

  state = {
    htmlDivSectionContents: null,
  };

  componentDidMount() {
    if (this.htmlDivSectionContents) {
      // 24px is due to internal padding on left and right plus 2px border on each side
      this.htmlDivSectionContents.style.maxWidth =
        this.htmlDivSectionContents.offsetWidth - 24 + 'px';
    }
  }

  saveSectionContents = (htmlDivSectionContents: ?HTMLDivElement) => {
    this.setState({htmlDivSectionContents: htmlDivSectionContents});
    this.htmlDivSectionContents = htmlDivSectionContents;
  };

  render() {
    return (
      <div style={styles.base}>
        <div>
          <span style={styles.headerText}>Imperials</span>
        </div>
        <div style={styles.sectionContents} ref={this.saveSectionContents}>
          {this.props.deployedGroups.map((imperialUnit: ImperialUnitType, index: number) => (
            <div
              key={`${imperialUnit.id}-${imperialUnit.groupNumber}-${index}`}
              style={styles.avatarWrapper}
            >
              <ImperialAvatar
                activateImperialGroup={this.props.activateImperialGroup}
                defeatImperialFigure={this.props.defeatImperialFigure}
                imperialUnit={imperialUnit}
                index={index}
                isImperialPlayerTurn={this.props.isImperialPlayerTurn}
                parentDiv={this.state.htmlDivSectionContents}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ImperialDashboard;
