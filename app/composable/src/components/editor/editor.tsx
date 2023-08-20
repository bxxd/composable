"use client";

import "./styles.scss";

import { DBlock } from "./extensions/block";
import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Text from "@tiptap/extension-text";
import { Paragraph } from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import { Document } from "./doc";
import DropCursor from "@tiptap/extension-dropcursor";
import { TrailingNode } from "./extensions/trailingNode";
import { EditorView } from "prosemirror-view";
import { Slice } from "prosemirror-model";

import { Icon } from "@iconify/react";
import chatPasteGoIcon from "@iconify/icons-material-symbols/chat-paste-go";
import { Node as ProseMirrorNode } from "prosemirror-model";

import { useCompletion } from "ai/react";

import { toast } from "sonner";

let mockdata = [
  {
    type: "dBlock",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "hi there" }],
      },
    ],
  },
  {
    type: "dBlock",
    attrs: { isAssistant: true },
    content: [
      {
        type: "paragraph",
        attrs: { level: 1 },
        content: [{ type: "text", text: "hi there2" }],
      },
    ],
  },
];

function handlePaste(view: EditorView, event: ClipboardEvent, slice: Slice) {
  // Prevent default paste behavior
  event.preventDefault();

  // Get plain text from clipboard
  const plainText = event.clipboardData?.getData("text/plain");

  if (!plainText) {
    return false;
  }

  // Insert the plain text at the current cursor position
  const transaction = view.state.tr.insertText(plainText);
  view.dispatch(transaction);

  return true; // Indicate that the paste event was handled
}

function extractTextFromJSON(data: any): { role: string; content: string }[] {
  let result: { role: string; content: string }[] = [];

  // Check if data has content and is an array
  if (data.content && Array.isArray(data.content)) {
    for (let item of data.content) {
      // Determine the role based on isAssistant attribute
      const role = item.attrs && item.attrs.isAssistant ? "assistant" : "user";

      // Check if item is of type dBlock and has content
      if (
        item.type === "dBlock" &&
        item.content &&
        Array.isArray(item.content)
      ) {
        for (let block of item.content) {
          // Check if block is of type paragraph and has content
          if (
            block.type === "paragraph" &&
            block.content &&
            Array.isArray(block.content)
          ) {
            for (let textItem of block.content) {
              // Check if textItem is of type text and has text property
              if (textItem.type === "text" && textItem.text) {
                result.push({ role: role, content: textItem.text });
              }
            }
          }
        }
      }
    }
  }

  return result;
}

const createNewNodeJSON = (text: string) => {
  if (!text || text.trim() === "") {
    throw new Error("Invalid text content provided.");
  }

  return {
    type: "dBlock",
    attrs: { isAssistant: true },
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      },
    ],
  };
};

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      DBlock,
      Document,
      Text,
      Paragraph,
      HardBreak,
      DropCursor.configure({
        width: 2,
        class: "notitap-dropcursor",
        color: "skyblue",
      }),

      Heading.configure({
        levels: [1, 2, 3],
      }),

      TrailingNode,
    ],
    content: {
      type: "doc",
      content: mockdata,
    },
    editorProps: {
      attributes: {
        class: `prose prose-p:my-2 prose-h1:my-2 prose-h2:my-2 prose-h3:my-2 prose-ul:my-2 prose-ol:my-2 max-w-none w-full focus:outline-none`,
        spellcheck: "false",
        suppressContentEditableWarning: "true",
      },
      handlePaste: handlePaste,
    },
  });

  const { complete, completion, isLoading, stop } = useCompletion({
    id: "composable",
    api: "/api/generate",
    onFinish: (_prompt, completion) => {},
    onError: (error) => {
      console.log("error", error);
      toast(error.message);
    },
  });

  const prev = useRef("");
  const newNodePosition = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) {
      // console.log("no editor");
      return;
    }

    const diff = completion.slice(prev.current.length);
    if (!diff) {
      // console.log("no diff");
      return;
    }

    prev.current = completion;

    const newNodeJSON = createNewNodeJSON(diff);

    const isTextNodeEmpty = (node: ProseMirrorNode | null) => {
      if (!node) return false;

      // Check if the text content is empty or consists of only whitespace
      return !node.textContent || !node.textContent.trim();
    };

    if (newNodePosition.current === null) {
      // Get the position of the last node
      const lastNode = editor.state.doc.lastChild;
      let position = editor.state.doc.content.size;

      // If the last node is empty, adjust the position
      if (lastNode && isTextNodeEmpty(lastNode)) {
        console.log("last node is empty");
        position -= lastNode.nodeSize;
      } else {
        console.log(
          "last node is not empty lastNode",
          lastNode,
          lastNode?.nodeSize
        );
      }

      setTimeout(() => {
        editor.commands.insertContentAt(position, newNodeJSON);
        // editor.commands.focus("end");
      }, 0);
      newNodePosition.current = position;
    } else {
      setTimeout(() => {
        editor.commands.insertContent(diff);
      }, 0);
    }
  }, [isLoading, editor, completion]);

  const handleAIButtonClick = () => {
    console.log("handleAIButtonClick");
    if (isLoading) {
      toast("AI is busy...");
      return;
    }
    prev.current = "";
    newNodePosition.current = null;
    let data = editor?.getJSON();

    console.log("json", JSON.stringify(data));

    data = extractTextFromJSON(data);
    let textData = JSON.stringify(data);
    toast.message("Sending to AI..." + textData);
    console.log("textData ", textData);
    complete(textData);
  };

  return (
    <section className="flex flex-col border-yellow-300 border border-dashed rounded-lg m-1 p-1 pt-3 pb-0">
      <EditorContent className="" editor={editor} />
      <div className="relative group inline-block">
        <span className="absolute z-10 hidden mt-2 text-xs bg-gray-500 text-white py-1 px-2 rounded-lg bottom-full right-0 whitespace-nowrap group-hover:block">
          Send to AI
        </span>
        <button
          className="ml-auto w-6 h-6 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5"
          onClick={handleAIButtonClick}
        >
          {/* <Icon icon={chatPasteGoIcon} className="text-white" /> */}
          <Icon icon="subway:down-2" />
        </button>
      </div>
    </section>
  );
};

export default Tiptap;
