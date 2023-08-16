import { AnyExtension, Editor, Extension } from "@tiptap/core";
import Text from "@tiptap/extension-text";
import { Document } from "./extensions/doc";
import { DBlock } from "./extensions/dBlock";
import { Paragraph } from "./extensions/paragraph";
import { TrailingNode } from "./extensions/trailingNode";

export const getExtensions = (): AnyExtension[] => {
  return [
    // necessary
    Document,
    DBlock,
    Paragraph,
    Text,
  ];
};
