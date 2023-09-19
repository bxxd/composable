import React, { useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from "@tiptap/react";
import { Icon } from "@iconify/react";
import plusIcon from "@iconify/icons-mdi/plus";
import dragIndicatorIcon from "@iconify/icons-ic/baseline-drag-indicator";
import closeIcon from "@iconify/icons-mdi/close";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineChevronRight from "@iconify/icons-ic/baseline-chevron-right"; // Right arrow icon
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon
import saveIcon from "@iconify/icons-mdi/content-save";
import { useGlobalContext } from "@/lib/context";
import { isTextNodeEmpty } from "@/lib/editor";
import { Node as ProseMirrorNode } from "prosemirror-model";
import { getTextFromDBlock, generateBlockId } from "@/lib/editor";

import {
  createNodeJSON,
  BlockStore,
  getBlockIdLevel,
  pushSubContent,
} from "@/lib/editor";
import _ from "lodash";

interface ExtendedNodeViewProps extends NodeViewProps {
  extraClass?: string;
}

export const BlockNodeView: React.FC<ExtendedNodeViewProps> = ({
  node,
  getPos,
  editor,
}) => {
  // console.log("BlockNodeView", node.attrs);

  const { savedList, setSavedList } = useGlobalContext();

  const addSavedToList = (node: ProseMirrorNode) => {
    console.log("addSavedToList", node.attrs.id);
    if (isTextNodeEmpty(node)) {
      console.warn("Cannot save empty node.");
      return;
    }
    const content = node.toJSON();
    setSavedList([...savedList, content]);
  };

  useEffect(() => {
    // console.log("BlockNodeView mounted or updated.", node.toJSON());
    if (!node.attrs.id) {
      console.log(
        "BlockNodeView: generating id for node with no id",
        node.attrs
      );
      const newAttrs = { ...node.attrs, id: generateBlockId(editor) };

      setTimeout(() => {
        editor.view.dispatch(
          editor.view.state.tr.setNodeMarkup(getPos(), undefined, newAttrs)
        );
      }, 0);
    }
  }, [node, getPos, editor]);

  const { role, data } = node.attrs;
  const isDataBlock = role === "data";

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedExcerpt, setExpandedExcerpt] = useState<string | null>(null);

  const handleOpenEditor = (node: any) => {
    const store = BlockStore.getInst();
    let currentContent = editor.getJSON();

    let ctxStack = store.get().ctxStack;
    ctxStack[getBlockIdLevel(node.attrs.id)] = currentContent;

    let content = node.attrs.children;

    if (content === null || content === undefined) {
      content = node.toJSON();
      content = _.cloneDeep(content);
      content.attrs.id = node.attrs.id + ".0";
      content = [content];
    }
    pushSubContent(editor, content);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const createNodeAfter = () => {
    const pos = getPos() + node.nodeSize;

    const newNodeJSON = createNodeJSON("", "user", editor);

    editor.commands.insertContentAt(pos, newNodeJSON);
  };

  const removeCurrentNode = () => {
    const pos = getPos();
    editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
  };

  return (
    <NodeViewWrapper as="div" className={`${node.attrs.role}-block`}>
      <div>
        <div className="flex justify-between ml-1 mt-1 mr-1">
          <div className="flex gap-2">
            <button
              type="button"
              className="d-block-button group-hover:opacity-100"
              onClick={removeCurrentNode}
            >
              <Icon icon={closeIcon} className="icon-size" />
            </button>
            <button
              type="button"
              className="d-block-button group-hover:opacity-100"
              onClick={createNodeAfter}
            >
              <Icon icon={plusIcon} className="icon-size" />
            </button>
            <div
              className="d-block-button group-hover:opacity-100"
              contentEditable={false}
              draggable
              data-drag-handle
            >
              <Icon icon={dragIndicatorIcon} className="icon-size" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="d-block-button group-hover:opacity-100"
              title="Save snippet for later re-use"
              onMouseDown={() => {
                console.log("Button was clicked.");
                addSavedToList(node);
              }}
            >
              <Icon icon={saveIcon} className="icon-size" />
            </button>
            <button
              type="button"
              className="d-block-button group-hover:opacity-100"
              title="Edit sub context with just this node."
              onMouseDown={() => handleOpenEditor(node)}
            >
              <Icon icon={baselineChevronRight} className="icon-size" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-grow">
        {node.attrs.children && node.attrs.children.length > 0 && (
          <div className="flex mt-2" style={{ marginBottom: "-7px" }}>
            <span className="italic opacity-25 pr-1 max-h-6 line-clamp-1">
              {getTextFromDBlock(node.attrs.children[0])}
            </span>
          </div>
        )}
        <div
          className={`flex items-center ${isExpanded ? "border-b" : ""} ${
            isDataBlock ? "cursor-pointer" : ""
          }`}
          onMouseDown={isDataBlock ? toggleExpanded : undefined}
        >
          <NodeViewContent className="node-view-content w-full pl-2 pr-2" />
          {isDataBlock && (
            <span className="ml-2">
              <Icon
                icon={isExpanded ? baselineExpandLess : baselineExpandMore}
                width={24}
                height={24}
              />
            </span>
          )}
        </div>
        {isDataBlock && isExpanded && (
          <div className="ml-0 mt-1 ">
            <div>
              <div>
                <strong>Category:</strong> {data.category}
              </div>
              <div>
                <strong>Subcategory:</strong> {data.subcategory}
              </div>
              <div>
                <strong>Insight:</strong> {data.insight}
              </div>
              <strong>Raw:</strong>
              <span
                className="ml-2 cursor-pointer"
                onClick={() =>
                  setExpandedExcerpt(
                    expandedExcerpt === data.excerpt ? null : data.excerpt
                  )
                }
              >
                <Icon
                  icon={
                    expandedExcerpt === data.excerpt
                      ? baselineChevronLeft
                      : baselineChevronRight
                  }
                  width={24}
                  height={24}
                />
              </span>
              {expandedExcerpt === data.excerpt
                ? data.excerpt
                : data.excerpt.substring(0, 25) + "...s"}{" "}
            </div>
            <div>
              <strong>Tags:</strong> {data.tags.join(", ")}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
