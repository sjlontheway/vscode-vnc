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
} from "vscode";
import * as Path from "path";
import * as fs from "fs-extra";
import {
  inputVNCServer,
  editServerLabel,
  showVncPassWdInput,
} from "../../lib/modal";
import { WebviewPanel, ExtensionContext } from "vscode";
import createChildProxy, {
  findLocalUnusedPort,
} from "../../lib/proxy/forkProxy";
import { ProxyOptions } from "../../lib/proxy/proxy";
import {
  ParentMessage,
  ChildProcessMessage,
  ChildProcessCode,
} from "../../message";
import { ChildProcess } from "child_process";

const localPortRange = [6881, 6892];
const STORE_CACHE = "vnc.json";

export class Vnc extends TreeItem {
  childProcess: ChildProcess | null = null;

  _panel: WebviewPanel | undefined;

  constructor(
    public label: string,
    readonly domain: string,
    public port: number
  ) {
    super(label);
    this.tooltip = `${domain}:${port}`;
    this.description = `${domain}:${port}`;
  }

  async startProxyServer() {
    const port = await findLocalUnusedPort(
      localPortRange[0],
      localPortRange[1]
    ).catch((reason) => reason);

    if (port <= 0) {
      throw Error("Port from [6881 to  6892] is not useable, please check!");
    }

    const options: ProxyOptions = {
      targetDomain: this.domain,
      targetPort: this.port,
      sourcePort: port,
    };
    if (!this.childProcess) {
      this.childProcess = createChildProxy(options);
      this.childProcess?.on("message", this.handleChildProcessMsg);
    }
  }

  handleChildProcessMsg = (message: ChildProcessMessage) => {
    console.log("handle child process:", message);
    if (message.type === ChildProcessCode.CONNECTED) {
      this.sendMsgToWebview(message);
    }
  };

  sendMessageToChildProcess = (message: ParentMessage) => {
    this.childProcess?.send(message);
  };

  disposeWebPanel() {
    this._panel?.dispose();
  }

  sendMsgToWebview(data: ChildProcessMessage) {
    this._panel?.webview.postMessage(data).then(
      (v) => {
        console.info(`send data: ${data.type}[${data.msg}] success: ${v}`);
      },
      (reason) =>
        console.error(`send data: ${data.type}[${data.msg}] failed: ${reason}`)
    );
  }

  showInputPassWd(reason: string) {
    showVncPassWdInput(`${this.domain}:${this.port}:${reason}`).then(
      (password) => {
        this._panel?.webview.postMessage({
          type: ChildProcessCode.VNC_PASSWORD,
          password,
        });
      }
    );
  }

  reconnectProxyServer() {
    this.childProcess?.kill();
    this.childProcess = null;
    this.startProxyServer();
  }

  set panel(panel: WebviewPanel | undefined) {
    this._panel = panel;
    if (this._panel) {
      this._panel.webview.onDidReceiveMessage((data) => {
        switch (data.type) {
          case ChildProcessCode.VNC_PASSWORD:
            const { reason } = data;
            this.showInputPassWd(reason);
            break;

          case ChildProcessCode.RECONNECT:
            this.reconnectProxyServer();
            break;
        }
      });

      this._panel?.onDidDispose(() => {
        this._panel = undefined;
        this.childProcess?.kill();
        this.childProcess = null;
      });
    }
  }

  get panel(): WebviewPanel | undefined {
    return this._panel;
  }

  iconPath = {
    light: Path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "vnc-server.svg"
    ),
    dark: Path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "vnc-server.svg"
    ),
  };
}

export class VncServerExplorerProvider implements TreeDataProvider<Vnc> {
  private vncLists: Vnc[] = [];
  constructor(
    private readonly _extensionPath: string,
    private vncManager: VncWebViewManager
  ) {
    try {
      if (fs.existsSync(Path.join(this._extensionPath, STORE_CACHE))) {
        const vncJsonObjectData: Vnc[] =
          fs.readJSONSync(Path.join(this._extensionPath, STORE_CACHE)) || [];
        const cacheVncLists = vncJsonObjectData.map(
          (v) => new Vnc(v.label, v.domain, v.port)
        );
        this.vncLists.push(...cacheVncLists);
      }
    } catch (error) {}
  }

  private _onDidChangeTreeData: EventEmitter<Vnc | undefined | null | void> =
    new EventEmitter<Vnc | undefined | null | void>();

  readonly onDidChangeTreeData: Event<Vnc | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    workspace.fs.writeFile(
      Uri.file(Path.join(this._extensionPath, STORE_CACHE)),
      Buffer.from(JSON.stringify(this.vncLists))
    );
    this._onDidChangeTreeData.fire(undefined);
  }

  _addToList(address: string): Vnc {
    const a = address.split(":");
    const domain = a[0];
    const port = parseInt(a[1] || "5900", 10);
    const vnc: Vnc = new Vnc(address, domain, port);
    if (this.vncLists.findIndex((v) => this.sameVncServer(v, vnc)) === -1) {
      this.vncLists.push(vnc);
      this.refresh();
    }
    return vnc;
  }

  add(): void {
    inputVNCServer().then((value) => {
      if (value !== null && value !== undefined) {
        this._addToList(value);
      }
    });
  }

  async connect(address: string | undefined): Promise<void> {
    if (!address) {
      address = await inputVNCServer();
    }

    if (!address) {
      return;
    }

    let item = this.vncLists.find((v) => v.label === address);
    if (!item) {
      item = this._addToList(address);
    }

    this.vncManager.createOrActiveVncWebview(item);
    item.startProxyServer();
  }

  sameVncServer(v1: Vnc, v2: Vnc) {
    return v1.port === v2.port && v1.domain === v2.domain;
  }

  delete(vnc: Vnc) {
    this.vncLists = this.vncLists.filter((v) => !this.sameVncServer(v, vnc));
    this.refresh();
  }

  editVncLabel(vnc: Vnc) {
    editServerLabel(vnc.label).then((value) => {
      const v: Vnc | undefined = this.vncLists.find((v) =>
        this.sameVncServer(v, vnc)
      );
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
  constructor(private _context: ExtensionContext) {}

  createOrActiveVncWebview(vnc: Vnc) {
    if (vnc.panel) {
      const column = window.activeTextEditor
        ? window.activeTextEditor.viewColumn
        : undefined;
      vnc.panel.reveal(column);
      return;
    }

    const panel = window.createWebviewPanel("vnc", vnc.label, ViewColumn.One, {
      enableCommandUris: true,
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        Uri.file(Path.join(this._context.extensionPath, "resources")),
      ],
    });
    panel.webview.html = this.createWebContent(panel.webview);

    vnc.panel = panel;
  }

  createWebContent(webview: Webview) {
    const vncUri = webview.asWebviewUri(
      Uri.file(
        Path.join(this._context.extensionPath, "resources", "js", "vncplay.js")
      )
    );
    const vncStartUri = webview.asWebviewUri(
      Uri.file(
        Path.join(this._context.extensionPath, "resources", "js", "start.js")
      )
    );

    return `
      <!DOCTYPE html>
      <html lang="en" style="width:100%;height:100%;padding:0,margin:0;overflow:hidden">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width,height=device-height, initial-scale=1.0">
            <title>Vnc</title>
        </head>
        <body style="width:100vw;height:100vh;overflow:hidden">
            <div  style="width:100vw;height:100vh;overflow:hidden;display:flex;flex-direction:column">
              <div id="root" style="flex:1;width:100vw;overflow:hidden;"></div>
            </div>
            <script src="${vncUri}"></script>
            <script src="${vncStartUri}"></script>
        </body>
      </html>
    `;
  }
}
