import React from "react";
import { BlockStore } from "@/lib/editor";
import { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DBlock } from "@/components/editor/extensions/block";
import { extensions } from "./extensions";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { JSONContent } from "@tiptap/react";

type PublishedProps = {};

const Published: React.FC<PublishedProps> = ({}) => {
  const blockState = BlockStore.getInst();

  const [hydrated, setHydrated] = useState(false);

  if (!blockState.loadFromLocalStorage()) {
    return <>nothing to publish..</>;
  }

  let jsonData: JSONContent = blockState.getCtxItemAtCurrentLevel();

  const contentArray = jsonData.reduce(
    (acc: JSONContent[], item: JSONContent) => {
      return item.content ? acc.concat(item.content) : acc;
    },
    []
  );

  console.log("contentArray", contentArray);

  // console.log("object data", jsonData);
  console.log("content", JSON.stringify(jsonData));

  const editor = useEditor({
    extensions: extensions,
    editable: false,
  });

  // console.log("editor", editor);

  useEffect(() => {
    if (editor && !hydrated) {
      console.log("hydrating..");
      setTimeout(() => {
        editor.commands.setContent(contentArray);
      }, 0);
      setHydrated(true);
    }
  }, [editor, hydrated, contentArray]);

  return (
    <>
      <div className="flex p-0 w-full overflow-auto">
        {/* TipTap Component */}
        <div className="flex flex-col w-2/3 min-w-[41ch]">
          <div className="flex flex-col border border-dashed rounded-lg m-1 p-1 pt-1 pb-0  border-sky-300">
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="flex-grow w-1/3 min-w-[22ch]"></div>
      </div>
    </>
  );
};

export default Published;
