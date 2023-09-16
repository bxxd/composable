import "./styles.scss";

import React from "react";
import { BlockStore } from "@/lib/editor";
import { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { DBlock } from "@/components/editor/extensions/block";
import { publishedExtensions } from "./extensions";
import { Icon } from "@iconify/react";

// import openBookIcon from "@iconify-icons/emojione-v1/open-book";
import { useRouter } from "next/navigation";

import "react-toggle/style.css";

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

  // console.log("contentArray", contentArray);

  // console.log("content", JSON.stringify(jsonData));

  const editor = useEditor({
    extensions: publishedExtensions,
    editable: false,
  });

  useEffect(() => {
    if (editor) {
      blockState.loadFromLocalStorage();

      let jsonData: JSONContent = blockState.getCtxItemAtCurrentLevel();

      let contentArray = jsonData.reduce(
        (acc: JSONContent[], item: JSONContent) => {
          return item.content ? acc.concat(item.content) : acc;
        },
        []
      );

      console.log("hydrating..");
      setTimeout(() => {
        editor.commands.setContent(contentArray);
      }, 0);

      setHydrated(true);
    }
  }, [editor, hydrated]);

  const [activeToggle, setActiveToggle] = useState("All");

  const router = useRouter();

  return (
    <>
      <div className="flex p-0 w-full overflow-auto">
        {/* TipTap Component */}
        <div className="flex flex-col w-2/3 min-w-[41ch]">
          <div className="flex flex-col border-r border-b border-solid rounded-lg m-1 mb-5 pl-5 pr-2  border-gray-100 dark:border-gray-600 ">
            <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm">
              <button onClick={() => router.push("/")}>
                <Icon
                  icon="ph:book-open-thin"
                  width={21}
                  height={21}
                  color="#3c3c3c"
                />
              </button>
              <div className="flex space-x-2">
                <button
                  className={`toggleButton ${
                    activeToggle === "Assistant" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("Assistant")}
                >
                  Assistant
                </button>
                <button
                  className={`toggleButton ${
                    activeToggle === "User" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("User")}
                >
                  User
                </button>
                <button
                  className={`toggleButton ${
                    activeToggle === "All" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("All")}
                >
                  All
                </button>
              </div>
            </div>
            <EditorContent
              editor={editor}
              className="rounded-lg p-2 leading-relaxed outline-none "
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Published;
