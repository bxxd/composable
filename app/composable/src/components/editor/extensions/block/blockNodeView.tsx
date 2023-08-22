import React, { useMemo, useState } from "react";
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from "@tiptap/react";
import { Icon } from "@iconify/react";
import plusIcon from "@iconify/icons-mdi/plus";
import dragIndicatorIcon from "@iconify/icons-ic/baseline-drag-indicator";
import closeIcon from "@iconify/icons-mdi/close";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineChevronRight from "@iconify/icons-ic/baseline-chevron-right"; // Right arrow icon
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon

interface ExtendedNodeViewProps extends NodeViewProps {
  extraClass?: string;
}

export const BlockNodeView: React.FC<ExtendedNodeViewProps> = ({
  node,
  getPos,
  editor,
}) => {
  const { role, data } = node.attrs;
  const isDataBlock = role === "data";

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedExcerpt, setExpandedExcerpt] = useState<string | null>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const createNodeAfter = () => {
    const pos = getPos() + node.nodeSize;

    editor.commands.insertContentAt(pos, {
      type: "dBlock",
      content: [
        {
          type: "paragraph",
        },
      ],
    });
  };

  const removeCurrentNode = () => {
    const pos = getPos();
    editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`flex gap-2 group w-full relative ${node.attrs.role}-block`}
    >
      <section
        className="flex mt-2 pt-[2px] gap-1"
        aria-label="left-menu"
        contentEditable="false"
        suppressContentEditableWarning
      >
        <button
          type="button"
          className="d-block-button group-hover:opacity-100"
          onClick={removeCurrentNode}
        >
          <Icon icon={closeIcon} />
        </button>
        <button
          type="button"
          className="d-block-button group-hover:opacity-100"
          onClick={createNodeAfter}
        >
          <Icon icon={plusIcon} />
        </button>
        <div
          className="d-block-button group-hover:opacity-100"
          contentEditable={false}
          draggable
          data-drag-handle
        >
          <Icon icon={dragIndicatorIcon} />
        </div>
      </section>
      <div className="flex-col flex-grow">
        <div
          className={`flex items-center ${isExpanded ? "border-b" : ""} ${
            isDataBlock ? "cursor-pointer" : ""
          }`}
          onClick={isDataBlock ? toggleExpanded : undefined}
        >
          <NodeViewContent className={`node-view-content w-full`} />
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
                : data.excerpt.substring(0, 25) + "..."}{" "}
              {/* Adjust the length as needed */}
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
