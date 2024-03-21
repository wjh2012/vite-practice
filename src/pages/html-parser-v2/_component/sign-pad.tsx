import {EventData, MouseAction} from "@/pages/html-parser-v2/_component/socket-protocol.ts";
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {getStroke} from "perfect-freehand";
import {Button} from "@/components/ui/button.tsx";


interface Point {
  x: number;
  y: number;
}

export interface SignOutput {
  dataId: string;
  signPath: string[];
  scale: number;
}

export interface SignInput {
  dataId: string;
  backgroundText: string;
  originWidth: number;
  originHeight: number;
}

interface SignPadProps {
  setModalOpen: (v: boolean) => void;
  sendSignData: (mouseAction: MouseAction, v: any) => void;
  receivedSignData: EventData | null;
  signInput: SignInput | null;
  setSignOutput: (v: SignOutput) => void;
}

export const SignPad = ({
  setModalOpen,
  sendSignData,
  receivedSignData,
  signInput,
  setSignOutput,
}: SignPadProps) => {
  const [line, setLine] = useState<Point[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [padHeight, setPadHeight] = useState(0);

  useLayoutEffect(() => {
    if (!signInput) {
      return;
    }

    if (svgRef.current && signInput.originWidth !== 0) {
      const padWidth = svgRef.current.getBoundingClientRect().width;
      const ratio = padWidth / signInput.originWidth;
      setPadHeight(signInput.originHeight * ratio);
    }
  }, [signInput]);

  // 마우스 누름
  const onPointerDown = () => {
    setLine([]);
    sendSignData(MouseAction.MOUSE_DOWN, "");
  };

  // 마우스 움직임
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * 100) / 100;
    const y = Math.floor((e.clientY - rect.top) * 100) / 100;

    setLine((prevPoints) => [...prevPoints, { x, y }]);
    sendSignData(MouseAction.MOUSE_MOVE, { x, y });
  };

  // 마우스 뗌
  const onPointerUp = () => {
    setLines((lines) => [...lines, pathData]);
    sendSignData(MouseAction.MOUSE_UP, "");
  };

  const stroke = getStroke(
    line.map((point) => [point.x, point.y]),
    {
      size: Math.floor(padHeight / 22),
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    },
  );

  const getSvgPathFromStroke = (stroke: number[][]) => {
    if (!stroke.length) return "";
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const isLastPoint = i === arr.length - 1;
        const [x1, y1] = isLastPoint ? arr[0] : arr[i + 1];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...stroke[0], "Q"],
    );

    d.push("Z");
    return d.join(" ");
  };

  const pathData = getSvgPathFromStroke(stroke);

  const submit = () => {
    console.log("submit");
    const signOutput: SignOutput = {
      dataId: signInput?.dataId || "",
      signPath: lines,
      scale: signInput!.originHeight / padHeight,
    };
    setSignOutput(signOutput);
    closeModal();
  };

  const onSubmitButtonClick = () => {
    console.log("onSubmitClick");
    sendSignData(MouseAction.SIGN_SUBMIT, "");
    submit();
  };

  // 사인 모달 닫기
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    console.log("sign-pad rendered");
  }, []);

  useEffect(() => {
    console.log("Received Sign Data useEffect");
    console.log(receivedSignData);
    if (receivedSignData) {
      console.log(receivedSignData);
      const mouseAction = receivedSignData.mouseAction;
      const detail = receivedSignData.detail;

      switch (mouseAction) {
        case MouseAction.MOUSE_MOVE:
          const x = parseFloat(detail.x);
          const y = parseFloat(detail.y);
          setLine((prevPoints) => [...prevPoints, { x, y }]);
          break;
        case MouseAction.MOUSE_DOWN:
          setLine([]);
          break;
        case MouseAction.MOUSE_UP:
          setLines((lines) => [...lines, pathData]);
          break;
        case MouseAction.SIGN_SUBMIT:
          submit();
          break;
      }
    }
  }, [receivedSignData]);

  return (
    <div>
      <svg
        ref={svgRef}
        height={padHeight}
        className="w-full border border-solid border-black"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <style>
          {`
            text {
              -webkit-user-select: none;
              -moz-user-select: none; 
              -ms-user-select: none;
              user-select: none;
            }
          `}
        </style>
        <text
          x="14%"
          y="88%"
          fontSize={`${padHeight - 8}`}
          // textAnchor="middle"
          // dominantBaseline="middle"
          fill="lightgrey"
        >
          {signInput?.backgroundText}
        </text>
        {lines.map((line, index) => (
          <path key={index} d={line} stroke="black" strokeWidth="2" />
        ))}
        <path d={pathData} stroke="black" strokeWidth="2" />
      </svg>
      <Button onClick={onSubmitButtonClick}> 제출 </Button>
    </div>
  );
};
