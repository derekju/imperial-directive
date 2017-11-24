// @flow

import difference from 'lodash/difference';
import HeroAvatar from '../HeroAvatar';
import Modal from '../Modal';
import React from 'react';
import rebels from '../../data/rebels.json';

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
  roster: string[],
  setHeroActivateTwice: Function,
  type: string,
};

class HeroicHeroModal extends React.Component<HeroicHeroModalPropsType> {
  handleAvatarClick = (heroId: string) => {
    this.props.setHeroActivateTwice(heroId);
    this.props.closeModals(this.props.type);
  };

  render() {
    return (
      <Modal title="Heroic Heroes">
        <div style={styles.base}>
          <div style={styles.header}>Choose hero to receive an extra activation:</div>
          <div style={styles.units}>
            {difference(this.props.roster, this.props.canActivateTwice).map((heroId: string) => (
              <div onClick={() => this.handleAvatarClick(heroId)} style={styles.avatarStyle}>
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
