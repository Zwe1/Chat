import React from 'react';
import PropTypes from 'prop-types'
import classNames from 'classnames';
import Scrollbars from './scrollbar/SpringScrollbars';

import { findDOMNode } from 'react-dom';
import contains from 'rc-util/lib/Dom/contains';
import addEventListener from 'rc-util/lib/Dom/addEventListener';

import { Icon } from 'antd';

class OliDrawer extends React.Component {

  $overlay = null;

  $drawer = null;

  constructor(props) {
    super(props);

    this.state = {
      open: props.open,
      hiddenOverlay: true,
      hiddenDrawer: true,
    };
  }

  onAnimationEnded = () => {
    if (!this.state.open) {
      this.setState({
        hiddenOverlay: true,
        hiddenDrawer: true
      });
    }
  };

  handleCloseDrawer = () => {
    this.setState({
      open: false
    }, () => {
      console.log('close drawer remove document event');
      this.clearOutsideHandler();

      if (this.props.onClose) {
        this.props.onClose();
      }
    });
  };

  handleOpenDrawer = () => {
    this.setState({
      hiddenOverlay: false,
      hiddenDrawer: false,
      open: true
    }, () => {
      //document.onclick = () => {
      //  this.handleCloseDrawer();
      //};
    });
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.open != this.state.open) {
      nextProps.open
        ? this.handleOpenDrawer()
        : this.handleCloseDrawer();
    }
  }

  componentDidMount() {
    this.$drawer.addEventListener('webkitAnimationEnd', this.onAnimationEnded);
  }

  componentWillUnmount() {
    console.log('drawer will unmount.');

    this.$drawer.removeEventListener('webkitAnimationEnd', this.onAnimationEnded);
    this.clearOutsideHandler();
  }

  componentDidUpdate() {
    if (!this.clickOutsideHandler) {
      let currentDocument = this.getDocument();
      this.clickOutsideHandler = addEventListener(currentDocument, 'mousedown', this.onDocumentClick);
    }
  }

  getDocument() {
    return window.document;
  }

  clearOutsideHandler() {
    if (this.clickOutsideHandler) {
      this.clickOutsideHandler.remove();
      this.clickOutsideHandler = null;
    }
  }

  getPopupDomNode() {
    return this.$drawer ? findDOMNode(this.$drawer) : null;
  }

  onDocumentClick = (event) => {
    if (!this.state.open) {
      return;
    }

    console.log('drawer docuemnt click.');

    const target = event.target;
    const root = findDOMNode(this);
    const popupNode = this.getPopupDomNode();
    if (!contains(root, target) && !contains(popupNode, target)) {
      this.handleCloseDrawer();
      //this.props.onClickOther();
    }
  };

  getOverlayClassName() {
    return classNames(
      'react-drawer-overlay',
      'overlay',
      'animated',
      {
        'fadeIn': this.state.open,
        'fadeOut': !this.state.open,
        'hidden': this.state.hiddenOverlay
      }
    );
  }

  getDrawerClassName() {
    const { open } = this.state;

    let start;
    const position = this.props.position;
    switch (position) {
      case 'top':
        start = open ? 'Down' : 'Up';
        break;
      case 'bottom':
        start = open ? 'Up' : 'Down';
        break;
      case 'left':
        start = 'Left';
        break;
      case 'right':
        start = 'Right';
        break;
    }

    let direction = open ? 'In' : 'Out';
    return classNames(
      'drawer',
      `drawer-${position}`,
      'animated',
      `fade${direction}${start}`,    // slideInLeft
      {
        'hidden': this.state.hiddenDrawer
      }
    );
  }

  renderHeader(header) {
    return (
      <div className="drawer-header">
        <h2>{header}</h2>
      </div>
    );
  }

  renderClose() {
    return (
      <div className="drawer-close" onClick={this.handleCloseDrawer}>
        <Icon type="close"/>
      </div>
    );
  }

  render() {
    const overlayClass = this.getOverlayClassName();
    const drawerClass = this.getDrawerClassName();

    const { children, style, header, closable } = this.props;

    return (
      <div className="oli-drawer">
        {
          this.props.overlay // 遮罩层
            ? (
            <div
              ref={el => this.$overlay = el}
              className={overlayClass}
              onClick={this.handleCloseDrawer}
            />
          ) : null
        }

        <div
          className={drawerClass}
          style={style}
          ref={el => this.$drawer = el}
        >
          { header ? this.renderHeader(header) : null }
          { closable ? this.renderClose() : null }
          <div className="drawer-scroll-wrapper">
            <Scrollbars>
              { children }
            </Scrollbars>
          </div>
        </div>
      </div>
    );
  }

}

OliDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  position: PropTypes.oneOf([ 'top', 'bottom', 'right', 'left' ]),
  overlay: PropTypes.bool
};

OliDrawer.defaultProps = {
  closable: true,
  header: false,
  overlay: false,
  position: 'right',
  onClickOther: () => {
    // console.log('drawer click other.');
  },
  open: false,
  style: {},
};

export default OliDrawer;