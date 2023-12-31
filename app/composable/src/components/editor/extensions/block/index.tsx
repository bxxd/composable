import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BlockNodeView, MemoizedBlockNodeView } from "./blockNodeView";
import { Editor } from "@tiptap/core";
import { DataItem } from "@/lib/types";

export interface HandleAIButtonClickParams {
  editor?: Editor | null;
}

export interface BlockOptions {
  isAssistant?: boolean; // Make it optional if not all blocks will have it
  handleAIButtonClick: (params: HandleAIButtonClickParams) => void;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dBlock: {
      /**
       * Set a block node
       */
      setDBlock: (position?: number) => ReturnType;
    };
  }
}

export const DBlock = Node.create<BlockOptions>({
  name: "dBlock",
  priority: 1000,
  group: "dBlock",
  content: "block",
  draggable: true,
  selectable: true,
  inline: false,

  parseHTML() {
    return [{ tag: 'div[data-type="d-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "d-block" }),
      0,
    ];
  },

  addAttributes() {
    return {
      role: {
        default: "user",
      },
      data: {
        default: null,
      },
      id: {
        default: null,
      },
      children: {
        default: null,
      },
    };
  },

  addCommands() {
    return {
      setDBlock:
        (position) =>
        ({ state, chain }) => {
          console.log("setDBlock");
          const {
            selection: { from },
          } = state;

          const pos =
            position !== undefined || position !== null ? from : position;

          return chain()
            .insertContentAt(pos, {
              type: this.name,
              content: [
                {
                  type: "text",
                },
              ],
            })
            .focus(pos + 2)
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MemoizedBlockNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        this.options.handleAIButtonClick({ editor });
        return editor.chain().run();
      },
    };
  },
});
