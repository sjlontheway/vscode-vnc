
import RFB from './core/rfb';

const defaultOptions = {
  viewOnly: false,
  focusOnClick: false,
  clipViewport: false,
  dragViewport: false,
  resizeSession: false,
  scaleViewport: false,
  showDotCursor: true,
  background: '',
  qualityLevel: 6,
  compressionLevel: 2,
  retry: false,
  retryDuration: 3000
};

export default class VncDisplay {

  rfb = null;
  url;
  container;
  options;

  constructor(options, target, url) {
    if (!url) {
      throw new Error('Websocket Url is Required!');
    }

    if (!target) {
      throw new Error('VNC Screen container is Required!');
    }

    this.container = target;
    this.url = url;
    this.options = { ...defaultOptions, ...options };
  }

  connect = () => {
    this.disconnect();
    this.rfb = new RFB(this.container, this.url, this.options);
    this.registerListener();
  };

  disconnect = () => {
    if (!this.rfb) {
      return;
    }

    this.rfb.disconnect();
    this.rfb = null;
  };

  registerListener = () => {
    window.addEventListener('resize', this._onWindowResize);
    this.rfb.addEventListener('connect', () => {
      console.info('Connected to remote VNC.');
    });

    this.rfb.addEventListener('disconnect', () => {
      console.info(`Disconnected from remote VNC, retrying in ${retryDuration / 1000} seconds.`);
      if (this.options.retry) {
        setTimeout(this.connect, this.options.retryDuration);
      }
    });

    this.rfb.addEventListener('credentialsrequired', () => {
      const password = prompt("Password Required:");
      this.rfb.sendCredentials({ password: password });
    });

    this.rfb.addEventListener('desktopname', (e) => {
      console.info(`Desktop name is ${e.detail.name}`);
    });
  };

  removeAllListerners = () => {
    window.removeEventListener('resize', this._onWindowResize);
  };

  // handleClick = () => {
  //   this.rfb?.focus();
  // };

  // handleMouseEnter = () => {
  //   if (document.activeElement) {
  //     document.activeElement?.blur();
  //   }
  //   this.handleClick();
  // };

  // handleMouseLeave = () => {
  //   this.rfb?.blur();
  // };

  _onWindowResize = (e) => {
    this.rfb?._windowResize(e);
  };

  render = () => {
    this.connect();
  };

  unmount = () => {
    this.disconnect();
    this.removeAllListerners();
  };
}