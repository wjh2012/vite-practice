import {useCallback, useEffect, useRef, useState} from "react";
import {
  EventData, MouseAction, EventTarget,
  SocketAction, SocketBody, SocketHeader,
  SocketProtocol
} from "@/pages/html-parser-v2/_component/socket-protocol.ts";
import {SignInput, SignOutput, SignPad} from "@/pages/html-parser-v2/_component/sign-pad.tsx";
import { toast } from "sonner";
import {Toolbox} from "@/pages/html-parser-v2/_component/toolbox.tsx";
import {HtmlArea} from "@/pages/html-parser-v2/_component/html-area.tsx";
import {Dialog, DialogContent} from "@/components/ui/dialog.tsx";

const srcUrl = "http://localhost:3001/sample-data/sample.html";
const srcPath = "sample.html";

export const Workspace = () => {
  const ws = useRef<WebSocket | null>(null);
  const [room, setRoom] = useState("");
  const [dataToHtml, setDataToHtml] = useState<EventData | null>(null);
  const [dataToSign, setDataToSign] = useState<EventData | null>(null);

  const [htmlContent, setHtmlContent] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [signInput, setSignInput] = useState<SignInput | null>(null);
  const [signOutput, setSignOutput] = useState<SignOutput | null>(null);

  // 소켓 통신 시작
  useEffect(() => {
    console.log("workspace rendered");
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = useCallback((roomInput: string) => {
    const webSocket = new WebSocket("ws://localhost:8080/websocket");

    webSocket.onopen = () => {
      toast.success("연결됨");
      sendJoinRequest(roomInput);
    };

    webSocket.onmessage = (event) => {
      const socketProtocol = JSON.parse(event.data) as SocketProtocol;
      const socketHeader: SocketHeader = socketProtocol.socketHeader;
      const socketAction: SocketAction = socketHeader.socketAction;
      const send = socketHeader.send;
      const receive = socketHeader.receive;
      const socketBody = socketProtocol.socketBody;
      const author = socketBody.author;
      const roomId = socketBody.roomId;
      const payload = socketBody.payload;

      if (socketAction === SocketAction.MESSAGE) {
        const eventTarget = payload.eventTarget;

        console.log(payload);
        switch (eventTarget) {
          case EventTarget.SIGN:
            setDataToSign(payload);
            break;
          case EventTarget.HTML:
            setDataToHtml(payload);
            setDataToSign(null);
            break;
        }
      }
    };

    webSocket.onclose = () => {
      ws.current = null;
    };

    ws.current = webSocket;
  }, []);

  const joinRoom = useCallback(
    (roomInput: string) => {
      if (ws.current) {
        toast.message(`이미 ${room}방에 있습니다.`);
        return;
      }

      setRoom(roomInput);
      connectWebSocket(roomInput);
    },
    [room, connectWebSocket],
  );

  const leaveRoom = useCallback(() => {
    if (!ws) {
      return;
    }

    ws.current!.close(1000, "Component unmounted");
    ws.current = null;
    setRoom("");

    toast.success(`방에서 나갔습니다.`);
  }, []);

  const sendMessage = (inputMessage: any) => {
    if (!ws.current) {
      return;
    }
    const socketHeader: SocketHeader = {
      socketAction: SocketAction.MESSAGE,
      send: "client",
      receive: "server",
    };

    const socketBody: SocketBody = {
      author: "",
      roomId: room,
      payload: inputMessage,
    };

    const socketProtocol: SocketProtocol = {
      socketHeader: socketHeader,
      socketBody: socketBody,
    };

    if (ws && socketProtocol) {
      ws.current!.send(JSON.stringify(socketProtocol));
    }
  };

  const sendSignData = (mouseAction: MouseAction, detail: any) => {
    const eventData: EventData = {
      eventTarget: EventTarget.SIGN,
      mouseAction: mouseAction,
      detail: detail,
    };
    sendMessage(eventData);
  };
  const sendHtmlData = (mouseAction: MouseAction, detail: string) => {
    const eventData: EventData = {
      eventTarget: EventTarget.HTML,
      mouseAction: mouseAction,
      detail: detail,
    };
    sendMessage(eventData);
  };

  const sendJoinRequest = (roomInput: string) => {
    const socketHeader: SocketHeader = {
      socketAction: SocketAction.JOIN,
      send: "client",
      receive: "server",
    };

    const socketBody: SocketBody = {
      author: "",
      roomId: roomInput,
      payload: "",
    };

    const socketProtocol: SocketProtocol = {
      socketHeader: socketHeader,
      socketBody: socketBody,
    };
    if (ws && socketProtocol) {
      ws.current!.send(JSON.stringify(socketProtocol));
    }
  };

  // 소켓 통신 끝

  // html 데이터 시작

  const getHtml = useCallback(() => {
    setHtmlContent("");
    fetch(srcPath)
      .then((response) => response.text())
      .then((html) => {
        setHtmlContent(html);
        toast.success("html 불러오기 완료");
      })
      .catch((error) => toast.error(error + "html 불러오기 실패"));
  }, []);

  const sendConvertRequest = useCallback(() => {
    const blobHtml = new Blob([htmlContent], { type: "text/html" });
    const headers = new Headers({ "Content-Type": "text/html" });

    fetch("http://localhost:3001/html-to-pdf", {
      method: "POST",
      headers: headers,
      body: blobHtml,
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("PDF 변환 완료");
      })
      .catch((error) => toast.error(error + "PDF 변환 실패"));
  }, [htmlContent]);

  // html 데이터 끝

  const handleHtmlContentSync = (h: string) => {
    setHtmlContent(h);
  };

  return (
    <div>
      <Toolbox
        getHtml={getHtml}
        sendConvertRequest={sendConvertRequest}
        joinRoom={joinRoom}
        leaveRoom={leaveRoom}
      />

      <HtmlArea
        htmlContent={htmlContent}
        setModalOpen={setModalOpen}
        sendHtmlData={sendHtmlData}
        receivedHtmlData={dataToHtml}
        setSignInput={setSignInput}
        signOutput={signOutput}
        syncHtmlContent={handleHtmlContentSync}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-11/12">
          <SignPad
            setModalOpen={setModalOpen}
            sendSignData={sendSignData}
            receivedSignData={dataToSign}
            signInput={signInput}
            setSignOutput={setSignOutput}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
