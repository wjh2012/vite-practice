
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {EventData, MouseAction} from "@/pages/html-parser-v2/_component/socket-protocol.ts";
import {SignInput, SignOutput} from "@/pages/html-parser-v2/_component/sign-pad.tsx";

interface HtmlAreaProps {
  htmlContent: string;
  setModalOpen: (v: boolean) => void;
  sendHtmlData: (mouseAction: MouseAction, v: string) => void;
  receivedHtmlData: EventData | null;
  setSignInput: (v: SignInput) => void;
  signOutput: SignOutput | null;
  syncHtmlContent: (v: string) => void;
}

export const HtmlArea = ({
  htmlContent,
  setModalOpen,
  sendHtmlData,
  receivedHtmlData,
  setSignInput,
  signOutput,
  syncHtmlContent,
}: HtmlAreaProps) => {
  const htmlRef = useRef<HTMLDivElement>(null);

  // id 할당 및 사인영역 할당
  useEffect(() => {
    console.log("htmlContent rendered");
    registerSignArea();
    document.addEventListener("wheel", onScroll);
    allocateId();
    return () => {
      unRegisterSignArea();
      document.removeEventListener("wheel", onScroll);
    };
  }, [htmlContent]);

  // 사인 패드 결과를 붙여넣기
  useEffect(() => {
    if (!signOutput) {
      return;
    }

    const id = signOutput.dataId;
    const signSvg = htmlRef.current!.querySelector(
      `[sign-svg="${id}"]`,
    ) as HTMLElement;
    if (!signSvg) {
      return;
    }

    signSvg.innerHTML = "";

    if (!signOutput) {
      return;
    }

    signOutput.signPath.map((line) => {
      const path = document.createElement("path");
      path.setAttribute("d", line);
      path.setAttribute("stroke", "black");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("transform", `scale(${signOutput.scale})`);
      signSvg.appendChild(path);
    });

    if (signOutput.signPath.length === 0) {
      signSvg.setAttribute("signed", "false");
    } else {
      signSvg.setAttribute("signed", "true");
    }

    syncHtmlContent(htmlRef.current!.innerHTML);
  }, [signOutput]);

  // 웹소켓으로 전달받은 사인데이터
  useEffect(() => {
    if (receivedHtmlData) {
      console.log(receivedHtmlData);
      const mouseAction = receivedHtmlData.mouseAction;

      switch (mouseAction) {
        case MouseAction.SCROLL:
          window.scrollTo(0, receivedHtmlData.detail);
          break;
        case MouseAction.CHECKBOX:
          clickCheckBox(receivedHtmlData.detail);
          break;
        case MouseAction.SIGN_OPEN:
          openSignPad(receivedHtmlData.detail);
          break;
      }
    }
  }, [receivedHtmlData]);

  // html 할당
  const memoizedHTML = useMemo(() => {
    return { __html: htmlContent };
  }, [htmlContent]);

  // 아이디 할당
  const allocateId = useCallback(() => {
    const html = htmlRef.current!.querySelectorAll("*");
    html.forEach((element, index) =>
      element.setAttribute("data-id", `${index}`),
    );
  }, []);

  // 사인 영역 할당
  const registerSignArea = () => {
    const nodes = (htmlRef.current?.querySelectorAll(".font_w") ??
      []) as HTMLElement[];

    nodes.forEach((element, index) => {
      element.style.position = "relative";
      element.addEventListener("click", onSignAreaClick);
      element.setAttribute("sign", `${index}`);

      const existingSVG = element.querySelector("svg");
      if (existingSVG) {
        return;
      }

      const svg = document.createElement("svg") as unknown as SVGSVGElement;
      svg.setAttribute("sign-svg", `${index}`);
      svg.setAttribute("signed", "false");
      svg.setAttribute("width", `${element.offsetWidth}`);
      svg.setAttribute("height", `${element.offsetHeight}`);
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.pointerEvents = "none";
      element.appendChild(svg);
    });
  };

  const unRegisterSignArea = () => {
    const element = htmlRef && htmlRef.current;

    if (!element) {
      return;
    }
    const wFonts = element.querySelectorAll(".font_w");
    wFonts.forEach((element) => {
      element.removeEventListener("click", onSignAreaClick);
    });
  };

  // 사인 영역 클릭 시
  const onSignAreaClick = (event: Event) => {
    console.log("onSignAreaClick");
    const element = event.target as HTMLElement;
    const signId = element.getAttribute("sign") || "";
    openSignPad(signId);
    sendHtmlData(MouseAction.SIGN_OPEN, signId);
  };

  const openSignPad = (signId: string) => {
    console.log("openSignPad");
    const html = htmlRef.current!;
    const target = html.querySelector(`[sign="${signId}"]`) as HTMLElement;

    const singInput: SignInput = {
      dataId: signId,
      backgroundText: target.textContent || "",
      originWidth: target.offsetWidth,
      originHeight: target.offsetHeight,
    };

    setSignInput(singInput);
    openModal();
  };

  // 스크롤 이벤트 전송
  const onScroll = () => {
    sendHtmlData(MouseAction.SCROLL, `${window.scrollY}`);
  };

  // 사인 모달 열기
  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  // -------- 체크박스 클릭 시작 ---------- //
  const onCheckboxClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    const target = event.target as HTMLElement;
    const children = Array.from(target.children);
    const isLastChildren = children.filter(
      (item) => item.nodeName !== "br",
    ).length;

    if (isLastChildren === 0) {
      toggleCheckbox(target);

      const targetId = target.getAttribute("data-id");
      if (targetId) {
        sendHtmlData(MouseAction.CHECKBOX, targetId);
      }
    }
  };

  // 체크박스 클릭 이벤트
  const clickCheckBox = useCallback((id: string) => {
    const html = htmlRef.current!;
    const target = html.querySelector(`[data-id="${id}"]`) as HTMLElement;
    toggleCheckbox(target);
  }, []);

  const toggleCheckbox = useCallback((target: HTMLElement) => {
    let text = target.textContent;

    if (text && (text.includes("□") || text.includes("☑"))) {
      if (text.includes("□")) {
        text = text.replaceAll("□", "☑");
      } else if (text.includes("☑")) {
        text = text.replaceAll("☑", "□");
      }
      target.innerHTML = text;
    }
  }, []);

  // -------- 체크박스 클릭 끝 ---------- //

  return (
    <div>
      <div
        // dangerouslySetInnerHTML={{ __html: htmlContent }}
        dangerouslySetInnerHTML={memoizedHTML}
        ref={htmlRef}
        onMouseUp={onCheckboxClick}
      />
    </div>
  );
};
