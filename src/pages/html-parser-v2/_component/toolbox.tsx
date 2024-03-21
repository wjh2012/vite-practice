import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";

interface ToolbarProps {
  getHtml: () => void;
  sendConvertRequest: () => void;
  joinRoom: (v: string) => void;
  leaveRoom: () => void;
}
export const Toolbox = ({
  getHtml,
  sendConvertRequest,
  joinRoom,
  leaveRoom,
}: ToolbarProps) => {
  const [roomInput, setRoomInput] = useState("");

  useEffect(() => {}, []);

  const handleJoin = () => {
    joinRoom(roomInput);
  };

  return (
    <div className="fixed top-8 right-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <Button onClick={getHtml}>HTML 불러오기</Button>
        <Button onClick={sendConvertRequest}>PDF 변환</Button>
      </div>

      <div className="flex gap-2">
        <Input
          className="w-14"
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
        />
        <Button onClick={handleJoin}>입장</Button>
        <Button onClick={leaveRoom}>나가기</Button>
      </div>
    </div>
  );
};
