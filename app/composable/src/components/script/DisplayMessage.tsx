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

const deepEqual = (a: JSONContent[], b: JSONContent[]): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const DisplayMessage: React.FC<DisplayMessageProps> = ({
  content,
  handleNext,
}) => {
  const [opacity, setOpacity] = useState(0);

  console.log("rendering DisplayMessage with content", content);

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

  const editor = useEditor({
    extensions: publishedExtensions,
    content: { type: "doc", content: content },
    editable: true,
  });

  if (!editor) {
    return <></>;
  }

  let markdown = extractAllText(content);

  const transitionStyle =
    handleNext != null ? { transition: "opacity 1.5s ease-in", opacity } : {};

  return (
    <>
      <div
        style={transitionStyle}
        className="border p-3 rounded-lg flex-shrink-0 m-1"
      >
        {/* <div className="">{markdown}</div> */}
        <EditorContent editor={editor} />
        sssss
      </div>
    </>
  );
};

export default React.memo(DisplayMessage, (prevProps, nextProps) => {
  return (
    deepEqual(prevProps.content ?? [], nextProps.content ?? []) &&
    prevProps.handleNext === nextProps.handleNext
  );
});
