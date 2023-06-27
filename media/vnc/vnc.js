import RFB from "./core/rfb";

const defaultOptions = {
  viewOnly: false,
  focusOnClick: false,
  clipViewport: false,
  dragViewport: false,
  resizeSession: false,
  scaleViewport: false,
  showDotCursor: true,
  background: "",
  qualityLevel: 6,
  compressionLevel: 2,
  retry: false,
  retryDuration: 3000,
  // onPasswordInput: prompt("Password Required:"),
  reconnect: () => {},
};

export default class VncDisplay {
  rfb = null;
  url;
  container;
  options;

  constructor(options, target, url) {
    if (!url) {
      throw new Error("Websocket Url is Required!");
    }

    if (!target) {
      throw new Error("VNC Screen container is Required!");
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
    window.addEventListener("resize", this._onWindowResize);
    this.rfb.addEventListener("connect", () => {});

    this.rfb.addEventListener("disconnect", () => {
      if (this.options.retry) {
        setTimeout(() => {
          this.options.reconnect();
        }, this.options.retryDuration);
      }
    });

    this.rfb.addEventListener("credentialsrequired", (e) => {
      if (this.options.onPasswordInput) {
        this.options.onPasswordInput(
          this.url,
          "Password is needed or Password is incorrect!",
          (password) => {
            this.rfb.sendCredentials({ password: password });
          }
        );
      }
    });
  };

  removeAllListeners = () => {
    window.removeEventListener("resize", this._onWindowResize);
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
    this.removeAllListeners();
  };
}
