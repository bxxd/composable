import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { createNodeJSON } from "@/lib/editor";
import { Node } from "prosemirror-model";
import { getTextFromDBlock, isTextNodeEmpty } from "@/lib/editor";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function nodeEqualsType({ types, node }) {
  return (
    (Array.isArray(types) && types.includes(node.type)) || node.type === types
  );
}

/**
 * Extension based on:
 * - https://github.com/ueberdosis/tiptap/blob/v1/packages/tiptap-extensions/src/extensions/TrailingNode.js
 * - https://github.com/remirror/remirror/blob/e0f1bec4a1e8073ce8f5500d62193e52321155b9/packages/prosemirror-trailing-node/src/trailing-node-plugin.ts
 */

export interface TrailingNodeOptions {
  node: string;
  notAfter: string[];
}

export const TrailingNode = Extension.create<TrailingNodeOptions>({
  name: "trailingNode",

  addOptions() {
    return {
      node: "paragraph",
      notAfter: ["paragraph"],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name);
    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((node) => this.options.notAfter.includes(node.name));

    return [
      new Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          const { doc, tr, schema } = state;

          const shouldInsertNodeAtEnd = plugin.getState(state);

          const endPosition = doc.content.size;

          if (!shouldInsertNodeAtEnd) return;

          console.log("inserting new node at end");

          const newNodeData = createNodeJSON("", "user", this.editor); // Update text and role as needed
          const newNode = Node.fromJSON(schema, newNodeData);

          console.log("newNode", newNode.toJSON());

          // eslint-disable-next-line consistent-return
          return tr.insert(endPosition, newNode);
        },
        state: {
          init: (_, state) => {
            return false;
          },
          apply: (tr, value) => {
            console.log("trailingNode apply");

            if (tr.doc.lastChild?.attrs.role != "user") return true;

            // if (!isTextNodeEmpty(tr.doc.lastChild)) return true;

            if (!tr.docChanged) return value;

            let lastNode = (tr.doc.lastChild?.content as any)?.content?.[0];

            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
        },
      }),
    ];
  },
});
