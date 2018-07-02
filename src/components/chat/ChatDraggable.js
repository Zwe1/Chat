import React, { Component } from 'react';

import Draggable from 'react-draggable';

const maxHeight = 250;    // input最大高度

export default class ChatDraggable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      initHeight: props.height,
      x: 0,
      y: 0
    };
  }

  handleDrag = (event, target) => {
    const inputHeight = this.state.initHeight;

    const { y } = target;
    if (y <= 0 && y >= -maxHeight) {
      let computeY = y >= 0
        ? 0
        : y >= -maxHeight ? y : -maxHeight;

      this.setState({
        x: 0,
        y: computeY
      });

      this.props.onDrag(inputHeight - y);
      return true;
    }

    return false;
  };

  render() {
    const { x, y, initHeight }  = this.state;

    return (
      <Draggable
        axis="y"
        position={{ x, y }}
        onDrag={this.handleDrag}>
        <div
          style={{
            height    : 5,
            width     : '100%',
            background: 'transparent',
            position  : 'absolute',
            cursor    : 'n-resize',
            left      : 0,
            zIndex    : 10,
            bottom: initHeight - 2,
          }}
        />
      </Draggable>
    );
  }
};

ChatDraggable.defaultProps = {
  height: 160,
  onDrag: () => {
  },
};
