import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  Uri,
  ViewColumn,
  Webview,
  window,
  workspace,
} from 'vscode';
import * as Path from 'path';
import * as fs from 'fs-extra';
import { inputVNCServer, editServerLabel } from '../../lib/modal';
import { WebviewPanel, ExtensionContext } from 'vscode';
import createChildProxy, { findLocalUnusePort } from '../../lib/proxy/forkProxy';
import { ProxyOptions } from '../../lib/proxy/proxy';
import { ParentMessage, ChildProcessMessage, ChildProcessCode } from '../../message';
import { ChildProcess } from 'child_process';

const localPortRange = [6881, 6892];
const STORE_CACHE = 'vnc.json';


export class Vnc extends TreeItem {

  childProcess: ChildProcess | null = null;

  _panel: WebviewPanel | undefined;

  constructor(public label: string,
    readonly domain: string,
    public port: number

  ) {
    super(label);
    this.tooltip = `${domain}:${port}`;
    this.description = `${domain}:${port}`;
  }

  async startProxyServer() {
    const port = await findLocalUnusePort(localPortRange[0], localPortRange[1])
      .catch(reason => reason);

    if (port <= 0) {
      throw Error('Port from [6881 to  6892] is not useable, please check!');
    }

    const options: ProxyOptions = {
      targetDomain: this.domain,
      targetPort: this.port,
      sourcePort: port,
    };
    if (!this.childProcess) {
      this.childProcess = createChildProxy(options);
      this.childProcess?.on('message', this.handleChildProcessMsg);
    }
  }

  handleChildProcessMsg = (message: ChildProcessMessage) => {
    console.log('handle child process:', message);
    if (message.type === ChildProcessCode.CONNECTED) {
      this.sendMsgToWebview(message);
    }
  };

  sendMessageToChildProces = (message: ParentMessage) => {
    this.childProcess?.send(message);
  };

  disposeWebPanel() {
    this._panel?.dispose();
  }

  sendMsgToWebview(data: ChildProcessMessage) {
    this._panel?.webview.postMessage(data).then(v => {
      console.info(`send data: ${data.type}[${data.msg}] success: ${v}`);
    }, reason => console.error(`send data: ${data.type}[${data.msg}] failed: ${reason}`));
  }

  set panel(panel: WebviewPanel | undefined) {
    this._panel = panel;
    if (this._panel) {
      this._panel?.onDidDispose(
        () => {
          this._panel = undefined;
          this.childProcess?.kill();
          this.childProcess = null;
        },
      );
    }
  }

  get panel(): WebviewPanel | undefined {
    return this._panel;
  }

  iconPath = {
    light: Path.join(__filename, '..', '..', 'resources', 'light', 'vnc-server.svg'),
    dark: Path.join(__filename, '..', '..', 'resources', 'light', 'vnc-server.svg')
  };
}

export class VncServerExplorerProvider implements TreeDataProvider<Vnc> {

  private vncLists: Vnc[] = [];
  constructor(private readonly _extensionPath: string) {
    try {
      if (fs.existsSync(Path.join(this._extensionPath, STORE_CACHE))) {
        const vncJsonObjectData: Vnc[] = fs.readJSONSync(
          Path.join(this._extensionPath, STORE_CACHE)
        ) || [];
        const cacheVncLists = vncJsonObjectData.map(v => new Vnc(v.label, v.domain, v.port));
        this.vncLists.push(...cacheVncLists);
      }
    } catch (error) {

    }

  }

  private _onDidChangeTreeData: EventEmitter<Vnc | undefined | null | void> =
    new EventEmitter<Vnc | undefined | null | void>();

  readonly onDidChangeTreeData: Event<Vnc | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    workspace.fs.writeFile(Uri.file(Path.join(this._extensionPath, STORE_CACHE)),
      Buffer.from(JSON.stringify(this.vncLists)));
    this._onDidChangeTreeData.fire(undefined);
  }

  add(): void {
    inputVNCServer().then(value => {
      if (value !== null && value !== undefined) {
        const a = value.split(':');
        const domain = a[0];
        const port = parseInt(a[1] || '5900', 10);
        const vnc: Vnc = new Vnc(value, domain, port);
        if (this.vncLists.findIndex(v => this.sameVncServer(v, vnc)) === -1) {
          this.vncLists.push(vnc);
          this.refresh();
        }
      }
    });
  }

  sameVncServer(v1: Vnc, v2: Vnc) {
    return v1.port === v2.port && v1.domain === v2.domain;
  }

  delete(vnc: Vnc) {
    this.vncLists = this.vncLists.filter(v => !this.sameVncServer(v, vnc));
    this.refresh();
  }

  editVncLabel(vnc: Vnc) {
    editServerLabel(vnc.label).then(value => {
      const v: Vnc | undefined = this.vncLists.find(v => this.sameVncServer(v, vnc));
      if (v) {
        v.label = value || vnc.label;
        this.refresh();
      }
    });
  }

  getTreeItem(element: Vnc): Vnc | Thenable<Vnc> {
    return element;
  }

  getChildren(): Thenable<Vnc[]> {
    let data: Vnc[] = this.vncLists;
    return Promise.resolve(data || []);
  }
}

export class VncWebViewManager {

  constructor(private _context: ExtensionContext) { }

  createOrActiveVncWebview(vnc: Vnc) {
    if (vnc._panel) {
      const column = window.activeTextEditor
        ? window.activeTextEditor.viewColumn
        : undefined;
      vnc._panel.reveal(column);
      return;
    }

    const panel = window.createWebviewPanel('vnc', vnc.label,
      ViewColumn.One,
      {
        enableCommandUris: true,
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.file(Path.join(this._context.extensionPath, 'resources'))]
      });
    panel.webview.html = this.createWebContent(panel.webview);

    vnc.panel = panel;
  }


  createWebContent(webview: Webview) {
    const vncUri = webview.asWebviewUri(
      Uri.file(Path.join(this._context.extensionPath, 'resources', 'js', 'vncplay.js'))
    );
    const vncStartUri = webview.asWebviewUri(
      Uri.file(Path.join(this._context.extensionPath, 'resources', 'js', 'start.js'))
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
              <h3 id="title"/>
            </div>
            </div>
            <script src="${vncUri}"></script>
            <script src="${vncStartUri}"></script>
        </body>
      </html>
    `;
  }

}

