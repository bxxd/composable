"use client";

import "./styles.scss";

import { DBlock } from "./extensions/block";

import { useEditor, EditorContent } from "@tiptap/react";
import Text from "@tiptap/extension-text";
import { Paragraph, ParagraphOptions } from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import { Document } from "./doc";
import DropCursor from "@tiptap/extension-dropcursor";
import { TrailingNode } from "./extensions/trailingNode";
import { EditorView } from "prosemirror-view";
import { Slice } from "prosemirror-model";

import { Icon } from "@iconify/react";
import chatPasteGoIcon from "@iconify/icons-material-symbols/chat-paste-go";

import { useChat } from "ai/react";

import { toast } from "sonner";

// import { Markdown } from "tiptap-markdown";

let mockdata = {
  type: "doc",
  content: [
    {
      type: "dBlock",
      content: [
        {
          type: "paragraph",
          attrs: { level: 1 },
          content: [{ type: "text", text: "hi there" }],
        },
      ],
    },
  ],
};

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

      // Markdown.configure({
      //   html: false,
      //   transformCopiedText: true,
      // }),
    ],
    content: {
      type: "doc",
      content: [
        {
          type: "dBlock",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "hi there" }],
            },
          ],
        },
      ],
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

  const handleAIButtonClick = () => {
    toast("Button Pushed!");
  };

  return (
    <section className="flex flex-col border-yellow-300 border border-dashed rounded-lg m-1 p-4">
      <EditorContent className="" editor={editor} />
      <div className="relative group inline-block">
        <span className="absolute z-10 hidden mt-2 text-xs bg-gray-500 text-white py-1 px-2 rounded-lg bottom-full right-0 whitespace-nowrap group-hover:block">
          Send to AI
        </span>
        <button
          className="ml-auto w-6 h-6 bg-gray-400 hover:bg-gray-500 active:bg-gray-600 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5"
          onClick={handleAIButtonClick}
        >
          <Icon icon={chatPasteGoIcon} className="text-white" />
        </button>
        <p></p>
      </div>
    </section>
  );
};

export default Tiptap;
