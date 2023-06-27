/* eslint-disable @typescript-eslint/naming-convention */
import { Serializable } from "child_process";

export enum ChildProcessCode {
  CONNECTED = 0,
  VNC_SERVER_DISCONNECT = 1,
  VNC_SERVER_ERROR = 2,
  WEB_CLIENT_ERROR = 3,
  TRANSFORM_ERROR = 4,
  WEB_CLIENT_DISCONNECT = 5,
  VNC_PASSWORD = 6,
  RECONNECT = 7,
}

export interface Message {
  data: Serializable;
}

export interface ChildProcessMessage {
  type: ChildProcessCode | number;
  msg?: string;
  wsUrl?: string;
}

export interface ParentMessage {
  type: "exit";
  data?: Serializable;
}
