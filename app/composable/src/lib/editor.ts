import { Editor } from "@tiptap/core";
import { DataItem, RoleType } from "./types";

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

let lastCreatedBlockId: string | null = null;

export function generateBlockId(editor: Editor | null): string {
  if (editor === null) return "0";

  let maxBlockId = "0";
  editor.state.doc.forEach((node) => {
    if (node.type.name === "dBlock" && node.attrs.id) {
      const currentId = node.attrs.id.toString();
      if (compareBlockIds(currentId, maxBlockId) > 0) {
        maxBlockId = currentId;
      }
    }
  });

  console.log("maxBlockId", maxBlockId);
  console.log("lastCreatedBlockId", lastCreatedBlockId);

  // Reset lastCreatedBlockId if the main component doesn't match the current blocks schema
  if (lastCreatedBlockId !== null) {
    const [mainComponentMax] = maxBlockId.split(".");
    const [mainComponentLast] = lastCreatedBlockId.split(".");
    if (mainComponentMax !== mainComponentLast) {
      lastCreatedBlockId = null;
    }
  }

  let newBlockId;

  // If lastCreatedBlockId is null (first time or reset), work with maxBlockId
  if (lastCreatedBlockId === null) {
    newBlockId = incrementBlockId(maxBlockId);
  } else {
    // Compare maxBlockId and lastCreatedBlockId to get the larger one
    const comparison = compareBlockIds(maxBlockId, lastCreatedBlockId);
    if (comparison >= 0) {
      newBlockId = incrementBlockId(maxBlockId);
    } else {
      newBlockId = incrementBlockId(lastCreatedBlockId);
    }
  }

  console.log("created newBlockId", newBlockId);

  lastCreatedBlockId = newBlockId;
  return newBlockId;
}

// Compare two block IDs
// Returns -1 if id1 < id2, 1 if id1 > id2, 0 if equal
function compareBlockIds(id1: string, id2: string): number {
  const segments1 = id1.split(".");
  const segments2 = id2.split(".");

  const len = Math.min(segments1.length, segments2.length);

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(segments1[i], 10);
    const num2 = parseInt(segments2[i], 10);

    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  if (segments1.length < segments2.length) return -1;
  if (segments1.length > segments2.length) return 1;

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
