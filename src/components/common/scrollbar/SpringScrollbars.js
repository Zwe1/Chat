import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { SpringSystem, MathUtil } from 'rebound';

export default class SpringScrollbars extends Component {

  constructor(props, ...rest) {
    super(props, ...rest);
    this.handleSpringUpdate = this.handleSpringUpdate.bind(this);
  }

  componentDidMount() {
    this.springSystem = new SpringSystem();
    this.spring = this.springSystem.createSpring();
    this.spring.addListener({ onSpringUpdate: this.handleSpringUpdate });
  }

  componentWillUnmount() {
    this.springSystem.deregisterSpring(this.spring);
    this.springSystem.removeAllListeners();
    this.springSystem = undefined;
    this.spring.destroy();
    this.spring = undefined;
  }

  getScrollTop() {
    return this.refs.scrollbars.getScrollTop();
  }

  getScrollHeight() {
    return this.refs.scrollbars.getScrollHeight();
  }

  getHeight() {
    return this.refs.scrollbars.getHeight();
  }

  scrollToBottomWithAnimation() {
    const scrollHeight = this.getScrollHeight();
    this.scrollTopWithAnimation(scrollHeight);
  }

  /**
   * 到底是往下滚还是往上滚
   *
   * @param top
   */
  scrollTopWithAnimation(top) {
    const { scrollbars } = this.refs;

    const scrollTop = scrollbars.getScrollTop();
    this.spring.setCurrentValue(scrollTop).setAtRest();

    // const scrollHeight = scrollbars.getScrollHeight();
    // const val = MathUtil.mapValueInRange(top, 0, scrollHeight, scrollHeight * 0.2, scrollHeight * 0.8);
    this.spring.setEndValue(top);
  }

  scrollTo(x) {
    this.refs.scrollbars.scrollTop(x);
  }

  scrollToTop() {
    this.refs.scrollbars.scrollToTop();
  }

  scrollToBottom() {
    this.refs.scrollbars.scrollToBottom();
  }

  handleSpringUpdate(spring) {
    const { scrollbars } = this.refs;
    const val = spring.getCurrentValue();
    scrollbars.scrollTop(val);
  }

  render() {
    let classNames = [ 'oli-scrollbars' ];
    if ('className' in this.props) {
      classNames.push(this.props.className);
    }

    let style = { height: '100%' };
    if ('style' in this.props) {
      style = {
        ...style,
        ...this.props.style
      }
    }

    return (
      <Scrollbars
        {...this.props}
        style={style}
        className={classNames.join(' ')}
        renderTrackVertical={props => <div {...props} className="oli-track-vertical"/>}
        renderTrackHorizontal={props => <div {...props} className="oli-track-horizontal"/>}
        ref="scrollbars"
      />
    );
  }
}
