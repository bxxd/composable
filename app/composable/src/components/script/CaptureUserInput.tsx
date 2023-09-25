import React from "react";
// CaptureUserInput.tsx
import { useEditor } from "@tiptap/react";
import { publishedExtensions } from "./extensions";

const CaptureUserInput: React.FC<{ onSave: (content: string) => void }> = ({
  onSave,
}) => {
  const editor = useEditor({
    extensions: publishedExtensions,
    content: "",
    editable: true,
  });

  return (
    <div>
      <p>Your content editor for capturing user input</p>
      hi!!!
    </div>
  );
};

export default CaptureUserInput;
