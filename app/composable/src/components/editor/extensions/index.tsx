import StarterKit from "@tiptap/starter-kit";
// import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
// import TiptapImage from "@tiptap/extension-image";
// import TaskItem from "@tiptap/extension-task-item";
// import TaskList from "@tiptap/extension-task-list";
// import { Markdown } from "tiptap-markdown";
// import { InputRule } from "@tiptap/core";
// import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Text from "@tiptap/extension-text";
import { Paragraph } from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
import { Document } from "../doc";
import DropCursor from "@tiptap/extension-dropcursor";
import { TrailingNode } from "./trailingNode";
import { DBlock, HandleAIButtonClickParams } from "./block";

export function defaultExtensions(
  handleAIButtonClick: (params: HandleAIButtonClickParams) => void
) {
  return [
    StarterKit.configure({
      bulletList: {
        HTMLAttributes: {
          class: "list-disc list-outside leading-3 -mt-2",
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: "list-decimal list-outside leading-3 -mt-2",
        },
      },
      listItem: {
        HTMLAttributes: {
          class: "leading-normal -mb-2",
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: "border-l-4 border-stone-700",
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class:
            "rounded-sm bg-stone-100 p-5 font-mono font-medium text-stone-800",
        },
      },
      code: {
        HTMLAttributes: {
          class:
            "rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900",
          spellcheck: "false",
        },
      },
      horizontalRule: false,
      dropcursor: {
        width: 2,
        class: "notitap-dropcursor",
        color: "skyblue",
      },
      gapcursor: false,
    }),

    DBlock.configure({ handleAIButtonClick: handleAIButtonClick }),
    Document,
    // Text,
    // Paragraph,
    // HardBreak,
    // DropCursor.configure({
    //   width: 2,
    //   class: "notitap-dropcursor",
    //   color: "skyblue",
    // }),

    TrailingNode,

    Placeholder.configure({
      placeholder: "What can I do for you?",
      includeChildren: true,
    }),

    Color,
    TextStyle,
    TiptapUnderline,
    Highlight.configure({
      multicolor: true,
    }),

    TiptapLink,
    // Markdown.configure({
    //   html: false,
    //   transformCopiedText: true,
    // }),
  ];
}
