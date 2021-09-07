// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {

  const CONNECTED = 0;
  const VNC_SERVER_DISCONNECT = 1;
  const VNC_SERVER_ERROR = 2;
  const WEB_CLIENT_ERROR = 3;
  const TRANSFORM_ERROR = 4;
  const WEB_CLIENT_DISCONNECT = 5;

  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState();

  const container = /** @type {HTMLElement} */ (document.getElementById('root'));
  console.log('Initial state', oldState);

  const statusEl = document.getElementById('title');

  let display;
  // Handle messages sent from the extension to the webview
  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    console.log('message:', event);
    let statusTitle = '';
    switch (message.type) {
      case CONNECTED:
        statusTitle = 'Connecting to Vnc server....';
        vncPlay = new VncDisplay({
          scaleViewport: true,
          background: "#000000",
          style: "padding:20px;"
        }, container, message.wsUrl);

        vncPlay.render();
        break;
      case VNC_SERVER_DISCONNECT:
        statusTitle = 'Vnc server is Disconnected: ' + message.msg;
        break;

      case VNC_SERVER_ERROR:
        statusTitle = 'Vnc server is error:' + message.msg;

        break;

      case WEB_CLIENT_ERROR:
        statusTitle = 'Vscode extension Connection error:' + message.msg;
        break;

      case WEB_CLIENT_DISCONNECT:
        statusTitle = 'Vscode extension aborted connection!';
        break;

      case TRANSFORM_ERROR:
        statusTitle = 'Proxy Vnc Server data to Vscode extension error:' + message.msg;
        break;

    }
    statusEl.innerText = statusTitle;

  });
}());