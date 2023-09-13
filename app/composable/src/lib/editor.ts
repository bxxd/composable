import { Editor } from "@tiptap/core";
import { DataItem, RoleType } from "./types";
import { JSONContent } from "@tiptap/react";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { debounce } from "lodash";
// import useLocalStorage from "@/lib/hooks/use-local-storage";
import _ from "lodash";

export function getTextFromDBlock(dBlock: JSONContent): string | null {
  // Check if the content array and the nested content array are non-empty
  if (dBlock.content && dBlock.content[0].content) {
    // Find the first 'text' object and return its 'text' property
    const textObj = dBlock.content[0].content.find(
      (item) => item.type === "text"
    );
    if (textObj && textObj.text) {
      return textObj.text;
    }
  }

  // Return null if the 'text' property could not be found
  return null;
}

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

  private debouncedSave = debounce(() => {
    console.log("saving..");
    const serialized = this.serialize();
    // console.log("debouncedSave", serialized);
    localStorage.setItem("blockStore", serialized);
  }, 500);

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
    this.debouncedSave();
  }

  public serialize(): string {
    return JSON.stringify(this.data);
  }

  public loadFromLocalStorage(): boolean {
    const storedDataString = localStorage.getItem("blockStore");
    // console.log("loading from local storage", storedDataString);
    if (storedDataString) {
      this.deserialize(storedDataString);
      return true;
    }
    return false;
  }

  public setCtxItemAtLevel(
    level: number,
    ctxItem: JSONContent | undefined
  ): void {
    if (ctxItem && ctxItem.type === "doc") {
      ctxItem = ctxItem.content;
    }

    const currentCtxStack = this.data.ctxStack;
    currentCtxStack[level] = ctxItem; // Set the context item at the specified level
    this.data.ctxStack = currentCtxStack; // Update the internal context stack

    this.debouncedSave(); // Save changes (assuming you have a debouncedSave method)
  }

  public getCtxItemAtLevel(level: number): any {
    return this.data.ctxStack[level];
  }

  public getCtxItemAtCurrentLevel(): any {
    return this.data.ctxStack[this.data.level];
  }

  public deserialize(dataString: string): void {
    try {
      this.data = JSON.parse(dataString);
    } catch (e) {
      console.error("Error deserializing BlockStore data:", e);
    }
  }

  public saveNow(): void {
    this.debouncedSave.cancel(); // Cancel any pending debounced calls
    localStorage.setItem("blockStore", this.serialize());
  }
}

// export let lastId: string | null = null;

export function getBlockIdLevel(blockId: string | null | undefined): number {
  if (blockId == undefined || blockId == null) return 0;

  return blockId.split(".").length - 1;
}

export function generateNextBlockIdFromContent(
  content: Array<any>,
  level: number
): string {
  console.log("generateNextBlockIdFromContent", content, level);
  let maxBlockId: any = null;
  for (const node of content) {
    if (node.type === "dBlock" && node.attrs.id) {
      if (level === 0 || getBlockIdLevel(node.attrs.id) === level) {
        const currentId = node.attrs.id.toString();
        if (compareBlockIds(currentId, maxBlockId) > 0) {
          maxBlockId = currentId;
        }
      }
    }
  }
  return maxBlockId;
}

export function rewriteBlockIdsWithParentId(
  content: Array<any>,
  parentId: string
): Array<any> {
  if (!content) {
    return content;
  }
  let newContent = _.cloneDeep(content); // Create a deep copy using lodash
  let currentLevelId = 0; // Initialize the level ID for children

  for (const node of newContent) {
    if (node.type === "dBlock") {
      // Prepend parentId to the currentLevelId
      node.attrs.id = `${parentId}.${currentLevelId}`;
      currentLevelId++; // Increment the current level ID for the next iteration
    }
  }

  return newContent;
}

export function generateBlockId(editor: Editor | null): string | null {
  const store = BlockStore.getInst();
  const blockState = store.get();

  console.log("blockState", blockState);

  if (editor === null) {
    return null;
  }

  let data = editor.getJSON();
  let maxBlockId = generateNextBlockIdFromContent(
    data.content as Array<any>,
    blockState.level
  );

  if (
    blockState.level > 0 &&
    getBlockIdLevel(blockState.lastId) !== blockState.level
  ) {
    blockState.lastId = null;
  }

  let newBlockId;

  if (blockState.lastId === null) {
    newBlockId = incrementBlockId(maxBlockId);
  } else {
    const comparison = compareBlockIds(maxBlockId, blockState.lastId);
    newBlockId =
      comparison >= 0
        ? incrementBlockId(maxBlockId)
        : incrementBlockId(blockState.lastId);
  }

  store.set({ lastId: newBlockId });

  return newBlockId;
}

// Compare two block IDs
// Returns -1 if id1 < id2, 1 if id1 > id2, 0 if equal
export function compareBlockIds(id1: string, id2: string): number {
  console.log(`compareBlockIds: id1:${id1} id2:${id2}`);

  if (!id2) {
    return 1; // id2 is null, so id1 is greater
  }

  if (!id1) {
    return -1; // id1 is null, so id2 is greater
  }
  const segments1 = id1.split(".");
  const segments2 = id2.split(".");

  // console.log("compareBlockIds", segments1, segments2);

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
  if (!blockId) {
    return "0.0";
  }
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
  // const ctxStack = store.get().ctxStack;
  // store.set({ ctxStack: { ...ctxStack, [currentLevel]: currentContent } });
  store.setCtxItemAtLevel(currentLevel, currentContent);

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

    if (!lastNode) {
      console.warn("No last node");
    } else {
      const parentId = truncateId((lastNode as any).attrs.id);
      const parentNodeIndex = findNodeIndexById(higherContent, parentId); // Find the parent node
      // const parentNode = higherContent[parentNodeIndex];
      if (parentNodeIndex === -1) {
        console.log("No parent node for id", lastNode);
      } else {
        const newNode = _.cloneDeep(lastNode);

        if (newNode.attrs) {
          newNode.attrs.id = parentId;
          if (dBlockWithTextCount > 1) {
            newNode.attrs.children = currentContent; // Set the children to the current content
          } else {
            newNode.attrs.children = null;
          }
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

export const isTextNodeEmpty = (node: ProseMirrorNode | null) => {
  if (!node) return false;

  // Check if the text content is empty or consists of only whitespace
  return !node.textContent || !node.textContent.trim();
};
