import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
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

import { Blockquote } from "@tiptap/extension-blockquote";
import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Code } from "@tiptap/extension-code";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Dropcursor } from "@tiptap/extension-dropcursor";

import { Heading } from "@tiptap/extension-heading";
import { History } from "@tiptap/extension-history";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Italic } from "@tiptap/extension-italic";
import { ListItem } from "@tiptap/extension-list-item";
import { OrderedList } from "@tiptap/extension-ordered-list";

import { Strike } from "@tiptap/extension-strike";

export function defaultExtensions(
  handleAIButtonClick: (params: HandleAIButtonClickParams) => void
) {
  return [
    Blockquote,
    Bold,
    BulletList,
    Code,
    CodeBlock,

    Heading,
    History,
    HorizontalRule,
    Italic,
    ListItem,
    OrderedList,
    Strike,

    DBlock.configure({ handleAIButtonClick: handleAIButtonClick }),
    Document,
    Text,
    Paragraph,
    HardBreak,
    DropCursor.configure({
      width: 2,
      class: "notitap-dropcursor",
      color: "skyblue",
    }),

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
    Dropcursor,
    // Markdown.configure({
    //   html: false,
    //   transformCopiedText: true,
    // }),
  ];
}
