import { createConnection } from "net";
import {
  createServer as createHttpServer,
  IncomingMessage,
  RequestListener,
  Server,
  ServerResponse,
} from "http";
import { createServer as createHttpsServer } from "https";
import * as fs from "fs-extra";
import WebSocket = require("ws");
import {
  ChildProcessCode,
  ParentMessage,
  ChildProcessMessage,
  Message,
} from "../../message";

// eslint-disable-next-line @typescript-eslint/naming-convention
const WebSocketServer = WebSocket.Server;

export interface ProxyOptions {
  targetDomain: string;
  targetPort: number;
  sourcePort: number;
  keyFile?: string;
  certFile?: string;
}

// only upgrade websocket!
const httpRequest: RequestListener = (request, response) => {
  // not response any request
  errorHandler(response, 403, "403 Permission Denied");
};

const errorHandler = (response: ServerResponse, code: number, msg: string) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  response.writeHead(code, { "Content-Type": "text/plain" });
  response.write(msg + "\n");
  response.end();
};

const socketTransform = (
  client: WebSocket,
  targetAddress: string,
  targetPort: number
) => {
  console.log("socketTransform");
  const target = createConnection(targetPort, targetAddress, function () {
    console.log(
      `connected to remote host ${targetAddress}:${targetPort} target`
    );
  });

  target.on("data", function (data) {
    try {
      client.send(data);
    } catch (e: any) {
      console.error("Client closed, cleaning up target", e);
      target.end();
      sendMsgToParentProcess({
        type: ChildProcessCode.TRANSFORM_ERROR,
        msg: e.message,
      });
    }
  });

  target.on("end", function () {
    console.log("target disconnected");
    client.close();
    sendMsgToParentProcess({
      type: ChildProcessCode.VNC_SERVER_DISCONNECT,
      msg: "vnc server disconnect!",
    });
  });

  target.on("error", function (e) {
    console.error("target connection error");
    target.end();
    client.close();
    sendMsgToParentProcess({
      type: ChildProcessCode.VNC_SERVER_ERROR,
      msg: e.message,
    });
  });

  client.on("message", function (msg: Buffer) {
    target.write(msg);
  });

  client.on("close", function (code, reason) {
    console.log("WebSocket client disconnected: " + code + " [" + reason + "]");
    target.end();
    sendMsgToParentProcess({
      type: ChildProcessCode.WEB_CLIENT_DISCONNECT,
      msg: `WebSocket client disconnected:${code}[${reason}]`,
    });
  });

  client.on("error", function (e) {
    console.log("WebSocket client error: " + e);
    target.end();
    sendMsgToParentProcess({
      type: ChildProcessCode.WEB_CLIENT_ERROR,
      msg: e.message,
    });
  });
};

export default function proxyRequest(options: ProxyOptions) {
  const { targetDomain, targetPort, sourcePort, keyFile, certFile } = options;

  let webServer: Server;

  let wsProtocol: string;

  if (keyFile && certFile) {
    const key = fs.readFileSync(keyFile);
    const cert = fs.readdirSync(certFile);
    webServer = createHttpsServer({ cert, key }, httpRequest);
    wsProtocol = "wss://";
  } else {
    webServer = createHttpServer(httpRequest);
    wsProtocol = "ws://";
  }

  let wsServer;
  webServer.listen(sourcePort, () => {
    wsServer = new WebSocketServer({ server: webServer });
    wsServer.on("connection", (socket: WebSocket) =>
      socketTransform(socket, targetDomain, targetPort)
    );
    wsServer.on("error", (e) => console.log("Socket Server error:", e));
    wsServer.on("close", (...args) =>
      console.log("Socket Server close:reason", args)
    );
    sendMsgToParentProcess({
      type: ChildProcessCode.CONNECTED,
      wsUrl: `${wsProtocol}localhost:${sourcePort}`,
    });
  });
}

function exit() {
  process.exit();
}

/**
 *
 * @param message message from parent
 */
function handleParentMessage(message: ParentMessage) {
  console.log("handleParentMessage:", message);
  const type = message.type;
  switch (type) {
    case "exit":
      exit();
      break;
  }
}

function sendMsgToParentProcess(message: ChildProcessMessage) {
  process.send?.(message);
}

try {
  const options: ProxyOptions = JSON.parse(
    process.env.options || ""
  ) as ProxyOptions;
  process.title = "vnc proxy process";

  proxyRequest(options);
  process.on("message", handleParentMessage);
} catch (error) {
  if (process.send) {
    process.send({ error });
  }
}
