import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { editServerLabel, inputVNCServer } from '../../lib/modal';

const STORE_CACHE = 'vnc.json';

export class VncServerProvider implements vscode.TreeDataProvider<Vnc> {

  private vncLists: Vnc[] = [];
  constructor(private readonly _extensionPath: string) {
    if (fs.existsSync(path.join(this._extensionPath, STORE_CACHE))) {
      const vncJsonObjectData: Vnc[] = fs.readJSONSync(path.join(this._extensionPath, STORE_CACHE)) || [];
      vncJsonObjectData.map(v => new Vnc(v.label,v.address));

      this.vncLists.push();
    }
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Vnc | undefined | null | void> =
    new vscode.EventEmitter<Vnc | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<Vnc | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(this._extensionPath, STORE_CACHE)), Buffer.from(JSON.stringify(this.vncLists)));
    // fs.writeJSONSync(STORE_CACHE, this.vncLists);
    this._onDidChangeTreeData.fire(undefined);
  }

  add(vnc: Vnc): void {
    inputVNCServer().then(value => {
      if (value !== null && value !== undefined) {
        const vnc: Vnc = new Vnc(value, value);
        if (this.vncLists.findIndex(v => v.address === vnc.address) === -1) {
          this.vncLists.push(vnc);
        }
        this.refresh();
      }
    });
  }

  delete(vnc: Vnc) {
    this.vncLists = this.vncLists.filter(v => v.address !== vnc.address);
    this.refresh();
  }

  editVncLabel(vnc: Vnc) {
    editServerLabel(vnc.label).then(value => {
      const v: Vnc | undefined = this.vncLists.find(v => v.address === vnc.address);
      if (v) {
        v.label = value || vnc.address;
        this.refresh();
      }
    });
  }

  connect(vnc: Vnc) {

  }

  disconnected(vnc: Vnc) {

  }

  getTreeItem(element: Vnc): Vnc | Thenable<Vnc> {
    return element;
  }

  getChildren(element?: Vnc): Thenable<Vnc[]> {
    let data: Vnc[] = this.vncLists;
    return Promise.resolve(data || []);
  }

}

export class Vnc extends vscode.TreeItem {

  isconnecting = false;
  constructor(public label: string,
    readonly address: string,
  ) {

    super(label);
    // this.tooltip = this.address;
    // this.description = this.address;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'vnc-server.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'light', 'vnc-server.svg')
  };
}
