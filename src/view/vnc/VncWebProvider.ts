import { window, ExtensionContext, Uri, Webview, ViewColumn, WebviewPanel } from 'vscode';
import * as path from 'path';
import { Vnc } from './VncProvider';

export default class VncWebView {
  private _extensionPath: string;
  private readonly _panel: WebviewPanel;
  public vnc: Vnc;
  public static currentVncWebview: VncWebView;

  static createVncWebview(context: ExtensionContext, vnc: Vnc): VncWebView {
    const column = window.activeTextEditor
      ? window.activeTextEditor.viewColumn
      : undefined;

    if (VncWebView.currentVncWebview) {
      VncWebView.currentVncWebview._panel.reveal(column);
      return VncWebView.currentVncWebview;
    }

    return new VncWebView(context, vnc);
  }

  constructor(private context: ExtensionContext, vnc: Vnc) {
    this._extensionPath = context.extensionPath;
    this.vnc = vnc;
    this._panel = window.createWebviewPanel(vnc.address, vnc.address,
      ViewColumn.One,
      {
        enableCommandUris: true,
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.file(path.join(context.extensionPath, 'resources'))]
      });
    this._panel.webview.html = this.createWebContent(this._panel.webview);
  }

  sendConnectMessage(wsUrl: string) {
    this._panel.webview.postMessage({ command: 'connect', ...this.vnc, wsUrl });
  }

  createWebContent(webview: Webview) {
    const vncUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionPath, 'resources', 'js', 'vncplay.js'))
    );
    const vncStartUri = webview.asWebviewUri(
      Uri.file(path.join(this._extensionPath, 'resources', 'js', 'start.js'))
    );
    return `
      <!DOCTYPE html>
      <html lang="en" style="width:100%;height:100%">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,height=device-height, initial-scale=1.0">
            <title>Vnc</title>
        </head>
        <body style="width:100%;height:100%">
            <div id="root" style="width:100%;height:100%">
            </div>
            <script src="${vncUri}"></script>
            <script src="${vncStartUri}"></script>
        </body>
      </html>
    `;
  }

}