import React, {
  Component
} from "react";
import PropTypes from 'prop-types';


/**
 * 
 */
export default class ChatMessagePanel extends Component {

  render() {
    const {
      active,
      style = {},
      children,
    } = this.props;

    this._isActive = this._isActive || active;
    let isRender = active;

    // return isRender ? <div className="chat-message-panel-container" style={style}>
    //     {children} </div>
    //     : '';

    style.display = isRender ? 'block' : 'none';

    return (
      <div className="chat-message-panel-container" style={style}>
        {children }
      </div>
    );
  }

}

ChatMessagePanel.defaultProps = {
  placeholder: null,
};