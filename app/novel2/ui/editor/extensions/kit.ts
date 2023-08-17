import { AnyExtension, Editor, Extension } from "@tiptap/core";
import Text from "@tiptap/extension-text";
import { Document } from "./doc";
import { DBlock } from "./dBlock";
import { Paragraph } from "./paragraph";
import { TrailingNode } from "./trailingNode";
import DropCursor from "@tiptap/extension-dropcursor";
import GapCursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";

export const getExtensions = (): AnyExtension[] => {
  return [
    // necessary
    Document,
    DBlock,
    Paragraph,
    Text,
    DropCursor.configure({
      width: 2,
      class: "notitap-dropcursor",
      color: "skyblue",
    }),
    GapCursor,
    History,
    HardBreak,

    // markdown
  ];
};
