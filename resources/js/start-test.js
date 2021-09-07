// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {

  // const vscode = acquireVsCodeApi();

  // const oldState = vscode.getState();

  const container = /** @type {HTMLElement} */ (document.getElementById('root'));
  let vncPlay = new VncDisplay({
    scaleViewport: true,
    background:"#000000",
    style:"padding:20px;"
  }, container, "ws://localhost:6080/");

  vncPlay.render();
  
  // let display;
  // Handle messages sent from the extension to the webview
  // window.addEventListener('message', event => {
  //   const message = event.data; // The json data that the extension sent
  //   console.log(message)
  //   console.log(VncDisplay)

  //   switch (message.command) {
  //     case 'connect':
  //       vncPlay = new VncDisplay({
  //         scaleViewport: true,
  //         background:"#000000",
  //         style:"padding:20px;"
  //       }, container, message.wsUrl);

  //       vncPlay.render();
  //       break;

  //     case 'disconnect':
  //       display.unmount();
  //       break;
  //   }

  // });
}());