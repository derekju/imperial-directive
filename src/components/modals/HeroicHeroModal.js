// @flow

import HeroAvatar from '../HeroAvatar';
import Modal from '../Modal';
import React from 'react';
import rebels from '../../data/rebels.json';
import type {RebelUnitType} from '../../reducers/rebels';

const styles = {
  avatarStyle: {
    cursor: 'pointer',
  },
  base: {
    textAlign: 'center',
  },
  header: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  units: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '20px',
  },
};

type HeroicHeroModalPropsType = {
  closeModals: Function,
  canActivateTwice: string[],
  roster: RebelUnitType[],
  setHeroActivateTwice: Function,
  type: string,
};

class HeroicHeroModal extends React.Component<HeroicHeroModalPropsType> {
  handleAvatarClick = (heroId: string) => {
    this.props.setHeroActivateTwice(heroId);
    this.props.closeModals(this.props.type);
  };

  render() {
    let calculatedRoster = [];
    this.props.roster.forEach((unit: RebelUnitType) => {
      if (!this.props.canActivateTwice.includes(unit.id)) {
        calculatedRoster.push(unit.id);
      }
    });

    return (
      <Modal title="Heroic Heroes">
        <div style={styles.base}>
          <div style={styles.header}>Choose hero to receive an extra activation:</div>
          <div style={styles.units}>
            {calculatedRoster.map((heroId: string) => (
              <div
                key={heroId}
                onClick={() => this.handleAvatarClick(heroId)}
                style={styles.avatarStyle}
              >
                <HeroAvatar firstName={rebels[heroId].firstName} />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }
}

export default HeroicHeroModal;
