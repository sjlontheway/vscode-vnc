// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  Vnc,
  VncServerExplorerProvider,
  VncWebViewManager,
} from "./view/vnc/provider";

let vncManger: VncWebViewManager;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  vncManger = new VncWebViewManager(context);
  const vncTreeProvider = new VncServerExplorerProvider(
    context.extensionPath,
    vncManger
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("vncServers", vncTreeProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vnc-extension.add", () =>
      vncTreeProvider.add()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vnc-extension.delete", (vnc: Vnc) =>
      vncTreeProvider.delete(vnc)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vnc-extension.connect",
      async (vnc: Vnc) => {
        vncTreeProvider.connect(vnc?.label);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vnc-extension.disconnected",
      (vnc: Vnc) => {
        vnc.disposeWebPanel();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vnc-extension.editLabel", (vnc) =>
      vncTreeProvider.editVncLabel(vnc)
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
