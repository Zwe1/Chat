import React, { Component } from 'react';
import { Icon, message } from 'antd';
import Draggable from 'react-draggable';
import Slider from 'react-slick';
import FaSquareO from 'react-icons/lib/fa/square-o';
import FaClone from 'react-icons/lib/fa/clone';
import { observer, inject } from 'mobx-react';
import $ from 'jquery';

@inject(stores => ({
  chatStore: stores.chatStore,
}))
export default class LookPicture extends Component {
	constructor(props) {
		super(props);
		this.state = {
			imgArray: [],
			defaultValue: 0,
		};
    this.nowImg = 0;
    this.rotateFlag = 0;
    this.scaleAll = {};
    this.scaleNum = 0;
    this.downloadFlag = true;
    this.downloadInterval = null;
	}

	componentDidMount () {
    const {
      lookPictureMessage,
      lookPictureIndex,
    } = this.props.chatStore;

    let defaultValue = 0;

    lookPictureMessage.forEach((v, i) => {
      if(v.messageIndex === lookPictureIndex) {
        defaultValue = i;
      }
    })

    this.nowImg = defaultValue;

    this.setState({
      imgArray: lookPictureMessage,
      defaultValue: defaultValue
    });

    for(let i in this.refs) {
      if(i.indexOf('img') === 0) {
        this.refs[i].onmousedown = (e) => {
          e.preventDefault();
        }
      }
    }
	}

  handlePlus() {
  	const img = this.refs[`img-${this.nowImg}`];
  	if(++this.scaleNum > 10) {
  		this.scaleNum = 10;
  		return
  	}
    if (img.offsetWidth === 800 && this.scaleNum === 1) {
      img.style.maxWidth = 'inherit';
      img.style.width = `${800}px`;
      setTimeout(() => {
        img.style.width = `${800 * 1.4}px`;
      });
    } else {
      img.style.maxWidth = 'inherit';
      img.style.width = `${img.offsetWidth}px`;
  	  img.style.width = `${img.offsetWidth * 1.4}px`;
    }
  }

  handleMinus() {
  	const img = this.refs[`img-${this.nowImg}`];
  	if(parseInt(img.style.width) < 20) {
  		return
  	}
  	--this.scaleNum;
    img.style.width = `${img.offsetWidth}px`;
  	img.style.width = `${img.offsetWidth / 1.4}px`;
  }

  handleRotate() {
  	this.rotateFlag++;
  	const img = this.refs[`img-${this.nowImg}`];
  	img.style.transform = `rotate(${90 * this.rotateFlag}deg)`;	
  }

  handleDownload() {
    if (!this.downloadFlag) {
      return
    }
    this.downloadFlag = false;
    const { imgArray } = this.state;
    const imgObj = imgArray[this.nowImg];
    const imgSrc = imgObj.imgUrl ? imgObj.imgUrl : imgObj.imageBase64;

    if (this.browserIsIe()) { // 判断ie
      this.downloadInterval = setInterval(() => {
        this.createIframe(imgSrc);
      }, 200);
    } else {
      const a = document.createElement('a');
      a.setAttribute('download', imgSrc);
      a.setAttribute('href', imgSrc);

      setTimeout(() => {
        a.click();
        this.downloadFlag = true;
      }, 300);
    }
  }

  handleClose() {
    const { setLookPicture } = this.props.chatStore;
    setLookPicture(false);
  }

  createIframe(imgSrc) {
    if ($("#IframeReportImg").length === 0){
      $('<iframe style="display:none;" id="IframeReportImg" name="IframeReportImg" onload="downloadImg();" width="0" height="0" src="about:blank"></iframe>').appendTo("body");
    }
    if ($('#IframeReportImg').attr("src") != imgSrc) {
      $('#IframeReportImg').attr("src", imgSrc);
    } else {
      this.downloadImg();
    }
  }

  downloadImg() {
    if ($('#IframeReportImg').src != "about:blank") {
      window.frames["IframeReportImg"].document.execCommand("SaveAs");
      clearInterval(this.downloadInterval);
    }
  }

  browserIsIe() {
    if (!!window.ActiveXObject || "ActiveXObject" in window){
      return true;
    }
    else{
      return false;
    }
  }

  handleWheel = e => {
    const { deltaY } = e;
    const u = navigator.userAgent;
    if (!!u.match(/Mac OS X/)) {
      deltaY > 0 ? this.handlePlus() : this.handleMinus();
    } else if (!!u.match(/Windows NT/)) {
      deltaY < 0 ? this.handlePlus() : this.handleMinus();
    }

    event.preventDefault();
  };

  onSliderAfterChange = (index) => {
  	const img = this.refs[`img-${this.nowImg}`];
  	img.style.transform = '';
  	this.rotateFlag = 0;
  	this.scaleAll = Object.assign(this.scaleAll, {[this.nowImg]: this.scaleNum});
  	this.nowImg = index;
  	this.scaleNum = this.scaleAll[this.nowImg] ? this.scaleAll[this.nowImg] : 0;
  };

	render() {
		const { imgArray, defaultValue } = this.state;

		return (
			<div className='look-picture' >
        <div className='close' onClick={this.handleClose.bind(this)}></div>
				<div className='title'>
					<div className='left'></div>
					<div className='right'>
						<div className='tool'>
							<div className='tool-icon' onClick={this.handlePlus.bind(this)}>
                <Icon type="plus-circle-o"/>
                <span className='font'>放大</span>
              </div>
							<div className='tool-icon' onClick={this.handleMinus.bind(this)}>
                <Icon type="minus-circle-o"/>
                <span className='font'>缩小</span>
              </div>
              <div className='tool-icon' onClick={this.handleRotate.bind(this)}>
							  <Icon type="reload"/>
                <span className='font'>旋转</span>
              </div>
              <div className='tool-icon' onClick={this.handleDownload.bind(this)}>
                <Icon type="download"/>
                <span className='font'>下载</span>
              </div>
						</div>
					</div>
				</div>
				{ imgArray && imgArray.length > 0 && <Slider
		      speed={500}
		      initialSlide={defaultValue}
		      infinite={false}
		      swipe={false}
		      afterChange={this.onSliderAfterChange}
		    >
	        {imgArray.length > 0 ? imgArray.map((v, i) => <div key={i} className='img-content'>
	        	<Draggable>
	        		<div className='img-drag'>
	        			<img 
                  onWheel={e => this.handleWheel(e)}
                  ref={`img-${i}`} 
                  src={v.imgUrl ? v.imgUrl : v.imageBase64} 
                />
	        		</div>
	        	</Draggable>
	        </div>) : null}
	      </Slider> }
			</div>
		)
	}
}