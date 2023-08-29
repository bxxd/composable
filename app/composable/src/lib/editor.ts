import { Editor } from "@tiptap/core";
import { DataItem, RoleType } from "./types";
import { JSONContent } from "@tiptap/react";
import _ from "lodash";

export const getPrevText = (
  editor: Editor,
  {
    chars,
    offset = 0,
  }: {
    chars: number;
    offset?: number;
  }
) => {
  // for now, we're using textBetween for now until we can figure out a way to stream markdown text
  // with proper formatting: https://github.com/steven-tey/novel/discussions/7
  return editor.state.doc.textBetween(
    Math.max(0, editor.state.selection.from - chars),
    editor.state.selection.from - offset,
    "\n"
  );
  // complete(editor.storage.markdown.getMarkdown());
};

// BlockData interface
export interface BlockData {
  lastId: string | null;
  level: number;
  ctxStack: Record<number, any>;
}

// Singleton for BlockData
export class BlockStore {
  private static inst: BlockStore;
  private data: BlockData;

  private constructor() {
    this.data = { lastId: null, level: 0, ctxStack: {} };
  }

  public static getInst(): BlockStore {
    if (!BlockStore.inst) {
      BlockStore.inst = new BlockStore();
    }
    return BlockStore.inst;
  }

  public get(): BlockData {
    return this.data;
  }

  public set(newData: Partial<BlockData>): void {
    this.data = { ...this.data, ...newData };
  }
}

// export let lastId: string | null = null;

export function getBlockIdLevel(blockId: string | null | undefined): number {
  if (blockId == undefined || blockId == null) return 0;

  return blockId.split(".").length - 1;
}

export function generateBlockId(editor: Editor | null): string {
  if (editor === null) return "0";

  const store = BlockStore.getInst();
  const blockState = store.get();

  console.log("generateBlockId blockState", blockState);

  let data = editor.getJSON();
  console.log("data", data);

  let maxBlockId = "0";
  for (const node of data.content as Array<any>) {
    console.log("node", node.attrs);
    if (node.type === "dBlock" && node.attrs.id) {
      if (
        blockState.level === 0 ||
        getBlockIdLevel(node.attrs.id) === blockState.level
      ) {
        const currentId = node.attrs.id.toString();

        console.log("currentId", currentId);
        if (compareBlockIds(currentId, maxBlockId) > 0) {
          maxBlockId = currentId;
        }
      }
    }
  }

  console.log("maxBlockId", maxBlockId);
  console.log("lastId", blockState.lastId);

  if (
    blockState.level > 0 &&
    getBlockIdLevel(blockState.lastId) !== blockState.level
  ) {
    blockState.lastId = null;
  }

  let newBlockId;

  // If lastId is null (first time or reset), work with maxBlockId
  if (blockState.lastId === null) {
    newBlockId = incrementBlockId(maxBlockId);
  } else {
    // Compare maxBlockId and lastId to get the larger one
    const comparison = compareBlockIds(maxBlockId, blockState.lastId);
    console.log("comparison", comparison, maxBlockId, blockState.lastId);
    if (comparison >= 0) {
      newBlockId = incrementBlockId(maxBlockId);
    } else {
      newBlockId = incrementBlockId(blockState.lastId);
    }
  }

  console.log("created newBlockId", newBlockId);

  store.set({ lastId: newBlockId });
  const updatedState = store.get();
  console.log("updated lastId", updatedState.lastId);
  return newBlockId;
}
// Compare two block IDs
// Returns -1 if id1 < id2, 1 if id1 > id2, 0 if equal
export function compareBlockIds(id1: string, id2: string): number {
  const segments1 = id1.split(".");
  const segments2 = id2.split(".");

  console.log("compareBlockIds", segments1, segments2);

  // Check number of levels first.
  if (segments1.length > segments2.length) return 1;
  if (segments1.length < segments2.length) return -1;

  // Number of levels is the same, now compare individual segments.
  const len = segments1.length;
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(segments1[i], 10);
    const num2 = parseInt(segments2[i], 10);

    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
}

// Increment the last segment of a block ID
function incrementBlockId(blockId: string): string {
  const segments = blockId.split(".");
  const lastSegment = segments.pop() || "0";
  const incrementedLastSegment = (parseInt(lastSegment, 10) + 1).toString();
  return [...segments, incrementedLastSegment].join(".");
}

export const createNodeJSON = (
  input: string | DataItem,
  role: RoleType = "user",
  editor: Editor | null = null
) => {
  console.log("createNodeJSON", input, role);
  let text: string | null = null;
  let data: DataItem | null = null;
  let isEditable = role !== "data"; // If role is "data", editable is false. Otherwise, it's true.

  if (typeof input === "string") {
    text = input.trim() === "" ? null : input;
  } else {
    text = input?.title || null;
    data = input;
  }

  const textContent = text
    ? [
        {
          type: "text",
          text,
        },
      ]
    : [];

  return {
    type: "dBlock",
    attrs: {
      role,
      editable: isEditable,
      data,
      id: generateBlockId(editor),
    },
    content: [
      {
        type: "paragraph",
        content: textContent,
      },
    ],
  };
};

export function pushSubContent(editor: Editor, content: JSONContent[]) {
  const store = BlockStore.getInst();
  const currentDoc = editor.getJSON();
  const currentContent = currentDoc.content;

  let maxId = currentContent?.reduce((maxId: string, item: any) => {
    if (compareBlockIds(maxId, item.attrs.id) < 0) {
      return item.attrs.id;
    }
    return maxId;
  }, "");

  const currentLevel = getBlockIdLevel(maxId);

  console.log("currentLevel", currentLevel);
  const ctxStack = store.get().ctxStack;
  store.set({ ctxStack: { ...ctxStack, [currentLevel]: currentContent } });

  maxId = content.reduce((maxId: string, item: any) => {
    if (compareBlockIds(maxId, item.attrs.id) < 0) {
      return item.attrs.id;
    }
    return maxId;
  }, "");

  store.set({ lastId: maxId, level: getBlockIdLevel(maxId) });

  editor
    ?.chain()
    .clearContent()
    .setContent({ type: "doc", content: content })
    .run();
}

interface LastNodeResult {
  textNode: JSONContent;
  dBlockNode: JSONContent;
  dBlockWithTextCount: number;
}

const findLastNonEmptyNode = (
  nodes: JSONContent[],
  parentDBlock: JSONContent | null = null,
  count: number = 0
): LastNodeResult | null => {
  let lastNonEmptyNode: LastNodeResult | null = null;

  for (const node of nodes) {
    if (node.type === "dBlock") {
      parentDBlock = node;
    }

    if (node.type === "text" && node.text && node.text.trim() !== "") {
      if (parentDBlock) {
        count++;
        lastNonEmptyNode = {
          textNode: node,
          dBlockNode: parentDBlock,
          dBlockWithTextCount: count,
        };
      }
    }

    if (node.content) {
      const foundNode = findLastNonEmptyNode(node.content, parentDBlock, count);
      if (foundNode !== null) {
        count = foundNode.dBlockWithTextCount; // Update count
        lastNonEmptyNode = foundNode;
      }
    }
  }

  return lastNonEmptyNode;
};

const findLastNodeInData = (
  data: JSONContent[]
): [JSONContent | null, number] => {
  let lastDBlockNode: JSONContent | null = null;
  let dBlockWithTextCount = 0;

  for (const block of data) {
    if (block.type === "dBlock" && block.content) {
      const foundNode = findLastNonEmptyNode(
        block.content,
        block,
        dBlockWithTextCount
      );
      if (foundNode !== null) {
        lastDBlockNode = foundNode.dBlockNode;
        dBlockWithTextCount = foundNode.dBlockWithTextCount; // Update the count
      }
    }
  }

  return [lastDBlockNode, dBlockWithTextCount];
};

export function popSubContent(editor: Editor | null, accepted: boolean) {
  if (editor === null) {
    console.error("Editor is null");
    return;
  }
  const store = BlockStore.getInst();
  const currentDoc = editor.getJSON();
  const currentContent = currentDoc.content;
  const higherContent = store.get().ctxStack[store.get().level - 1];

  if (!higherContent) {
    console.error("No higher content to pop");
    return;
  }

  console.log(
    "### higherContent",
    higherContent,
    store.get().level,
    store.get().ctxStack
  );

  if (!currentContent) {
    console.warn("No current content");
  }

  const findNodeIndexById = (
    nodes: JSONContent[],
    targetId: string
  ): number => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].type === "dBlock" && nodes[i].attrs?.id === targetId) {
        return i;
      }
    }
    return -1; // Return -1 if not found
  };

  const truncateId = (input: string): string => {
    const parts = input.split(".");
    if (parts.length <= 1) {
      return "";
    }
    parts.pop();
    return parts.join(".");
  };

  console.log("currentContent", currentContent);

  if (accepted && currentContent) {
    const [lastNode, dBlockWithTextCount] = findLastNodeInData(currentContent);
    console.log("lastNode", lastNode);

    if (!lastNode) {
      console.warn("No last node");
    } else {
      const parentId = truncateId((lastNode as any).attrs.id);
      const parentNodeIndex = findNodeIndexById(higherContent, parentId); // Find the parent node
      if (parentNodeIndex === -1) {
        console.log("No parent node for id", lastNode);
      } else {
        const newNode = _.cloneDeep(lastNode);
        newNode.attrs.id = parentId;
        if (dBlockWithTextCount > 1) {
          newNode.attrs.children = currentContent; // Set the children to the current content
        } else {
          newNode.attrs.children = null;
        }
        higherContent[parentNodeIndex] = newNode; // Replace the parent node with the new node
      }
    }
  }

  store.set({ level: store.get().level - 1 });

  editor
    ?.chain()
    .clearContent()
    .setContent({ type: "doc", content: higherContent })
    .run();
}
