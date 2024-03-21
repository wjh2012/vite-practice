export type SocketProtocol = {
  socketHeader: SocketHeader;
  socketBody: SocketBody;
};

export type SocketHeader = {
  socketAction: SocketAction;
  send: string;
  receive: string;
};
export type SocketBody = {
  author: string;
  roomId: string;
  payload: any;
};

export type EventData = {
  eventTarget: EventTarget;
  mouseAction: MouseAction;
  detail: any;
};

export enum SocketAction {
  SYSTEM = "SYSTEM",
  MESSAGE = "MESSAGE",
  JOIN = "JOIN",
}

export enum EventTarget {
  SIGN = "SIGN",
  HTML = "HTML",
  BUTTON = "BUTTON",
}

export enum MouseAction {
  MOUSE_DOWN = "MOUSE_DOWN",
  MOUSE_UP = "MOUSE_UP",
  MOUSE_MOVE = "MOUSE_MOVE",
  SCROLL = "SCROLL",
  CHECKBOX = "CHECKBOX",
  SIGN_SUBMIT = "SIGN_SUBMIT",
  SIGN_OPEN = "SIGN_OPEN",
}
