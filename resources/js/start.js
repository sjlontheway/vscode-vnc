// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const CONNECTED = 0;
  const VNC_SERVER_DISCONNECT = 1;
  const VNC_SERVER_ERROR = 2;
  const WEB_CLIENT_ERROR = 3;
  const TRANSFORM_ERROR = 4;
  const WEB_CLIENT_DISCONNECT = 5;
  const VNC_PASSWORD = 6;
  const RECONNECT = 7;
  const vscode = acquireVsCodeApi();

  const container = /** @type {HTMLElement} */ (
    document.getElementById("root")
  );

  const statusEl = document.getElementById("title");

  let sendPasswordCallback;

  // call host input password input view;
  function onCallPassword(address, reason, callback) {
    vscode.postMessage({ type: VNC_PASSWORD, address, reason });
    sendPasswordCallback = callback;
  }

  // send msg to host retry connect vnc server
  function reconnect() {
    vscode.postMessage({ type: RECONNECT });
  }

  function getConnectConfig() {
    return {
      scaleViewport: true,
      background: "#000000",
      style: "padding:0px;margin:0px",
      retry: true,
      retryDuration: 1000,
      reconnect: reconnect,
      onPasswordInput: onCallPassword,
    };
  }

  let display;
  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    console.log("message:", event);
    let statusText = "";
    switch (message.type) {
      case CONNECTED:
        statusText = `Vnc server[${message.wsUrl}]`;
        vncPlay = new VncDisplay(getConnectConfig(), container, message.wsUrl);
        vncPlay.render();
        break;
      case VNC_SERVER_DISCONNECT:
        statusText = "Vnc server is Disconnected: " + message.msg;
        break;
      case VNC_PASSWORD:
        if (sendPasswordCallback) {
          sendPasswordCallback(message.password);
        }
        break;

      case VNC_SERVER_ERROR:
        statusText = "Vnc server is error:" + message.msg;
        break;

      case WEB_CLIENT_ERROR:
        statusText = "Vscode extension Connection error:" + message.msg;
        break;

      case WEB_CLIENT_DISCONNECT:
        statusText = "Vscode extension aborted connection!";
        break;

      case TRANSFORM_ERROR:
        statusText =
          "Proxy Vnc Server data to Vscode extension error:" + message.msg;
        break;
    }
    console.debug(statusText);
  });
  window.addEventListener("unload", () => {
    if (display) {
      display.disconnect();
    }
  });
})();
