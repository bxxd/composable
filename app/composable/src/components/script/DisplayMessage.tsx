// DisplayMessage.tsx
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { JSONContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { extractAllText } from "@/lib/editor";

type DisplayMessageProps = {
  content: JSONContent[] | undefined;
  handleNext?: ((userInput: string) => void) | null;
};

const DisplayMessage: React.FC<DisplayMessageProps> = ({
  content,
  handleNext,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!handleNext) {
      return;
    }
    const timer = setTimeout(() => {
      // console.log("here....", handleNext);
      // Assume handleSave has been passed as a prop
      handleNext("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleNext]);

  useEffect(() => {
    // You can use a setTimeout to handle the duration of the transition
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100); // Starts after 100ms

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array means this effect runs once when component mounts

  let markdown = extractAllText(content);

  return (
    <div style={{ transition: "opacity 1.5s ease-in", opacity: opacity }}>
      <div className="">markdown: {markdown}</div>
    </div>
  );
};

export default DisplayMessage;
