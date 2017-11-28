// @flow

import blockPng from '../../assets/icons/block.png';
import {ELITE_RED} from '../../styles/colors';
import insightPng from '../../assets/icons/insight.png';
import Modal from '../Modal';
import React from 'react';
import strengthPng from '../../assets/icons/strength.png';
import techPng from '../../assets/icons/tech.png';

const styles = {
  base: {
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center',
  },
  story: {
    fontSize: '14px',
    fontStyle: 'italic',
    marginTop: '15px',
    textAlign: 'center',
  },
};

type ResolveEventModalPropsType = {
  closeModals: Function,
  story: string,
  text: string[],
  title: string,
  type: string,
};

class ResolveEventModal extends React.Component<ResolveEventModalPropsType> {
  handleButtonClick = () => {
    this.props.closeModals(this.props.type);
  };

  handleTextSubs(text: string) {
    let replaced = text;

    replaced = replaced.replace(
      /{ELITE}(.*?){END}/g,
      `<span style='color: ${ELITE_RED}; font-weight: bold'>$1</span>`
    );
    replaced = replaced.replace(
      /{BLOCK}/g,
      `<img alt="Block" src='${
        blockPng
      }' style='height: 20px; width: 18px; vertical-align: middle' />`
    );
    replaced = replaced.replace(
      /{STRENGTH}/g,
      `<img alt="Strength" src='${
        strengthPng
      }' style='height: 24px; width: 18px; vertical-align: middle' />`
    );
    replaced = replaced.replace(
      /{INSIGHT}/g,
      `<img alt="Insight" src='${
        insightPng
      }' style='height: 24px; width: 20px; vertical-align: middle' />`
    );
    replaced = replaced.replace(
      /{TECH}/g,
      `<img alt="Tech" src='${
        techPng
      }' style='height: 24px; width: 18px; vertical-align: middle' />`
    );
    return replaced;
  }

  render() {
    const buttonText = 'Done';
    return (
      <Modal
        buttonText={buttonText}
        handleButtonClick={this.handleButtonClick}
        title={this.props.title}
      >
        {Boolean(this.props.story) ? <div style={styles.story}>{this.props.story}</div> : null}
        {this.props.text.map((text: string, index: number) => (
          <div
            key={`text-${index}`}
            style={styles.base}
            dangerouslySetInnerHTML={{__html: this.handleTextSubs(text)}}
          />
        ))}
      </Modal>
    );
  }
}

export default ResolveEventModal;
