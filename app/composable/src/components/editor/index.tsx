"use client";

import "./styles.scss";

import { DBlock } from "./extensions/block";

import { useEditor, EditorContent } from "@tiptap/react";
import Text from "@tiptap/extension-text";
import { Paragraph, ParagraphOptions } from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
// import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { Document } from "./doc";
import DropCursor from "@tiptap/extension-dropcursor";
import { TrailingNode } from "./extensions/trailingNode";
import { Markdown } from "tiptap-markdown";

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

function handlePaste(view, event, slice) {
  // Prevent default paste behavior
  event.preventDefault();

  // Get plain text from clipboard
  const plainText = event.clipboardData.getData("text/plain");

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

  return (
    <section className="border-yellow-300 border border-dashed rounded-lg m-1 p-4">
      <EditorContent className="" editor={editor} />
    </section>
  );
};
// flex justify-start p-4 border-yellow-300 border border-dashed rounded-lg m-1 w-full
// flex w-full
export default Tiptap;
