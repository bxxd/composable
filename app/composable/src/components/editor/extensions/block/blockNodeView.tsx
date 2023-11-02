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
import { JSONContent } from "@tiptap/react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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

const areEqual = (
  prevProps: ExtendedNodeViewProps,
  nextProps: ExtendedNodeViewProps
) => {
  const prevAttrs = prevProps.node.attrs;
  const nextAttrs = nextProps.node.attrs;

  // Shallow compare attrs except for 'children'
  const areAttrsEqual =
    prevAttrs.role === nextAttrs.role &&
    prevAttrs.data === nextAttrs.data &&
    prevAttrs.id === nextAttrs.id;

  // Deep compare 'children' attribute if necessary
  const areChildrenEqual = prevAttrs.children === nextAttrs.children; // Replace with deep comparison if needed

  // Deep compare 'content' using JSON.stringify
  const prevContentStr = JSON.stringify(prevProps.node.content);
  const nextContentStr = JSON.stringify(nextProps.node.content);
  const isContentEqual = prevContentStr === nextContentStr;

  return areAttrsEqual && areChildrenEqual && isContentEqual;
};

export const BlockNodeView: React.FC<ExtendedNodeViewProps> = ({
  node,
  getPos,
  editor,
}) => {
  // console.log("BlockNodeView re-rendering");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { savedList, setSavedList } = useGlobalContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectRole = (role: string) => {
    // Prepare new attributes
    const newAttrs = { ...node.attrs, role };

    // Defer the transaction
    setTimeout(() => {
      editor.view.dispatch(
        editor.view.state.tr.setNodeMarkup(getPos(), undefined, newAttrs)
      );
    }, 0);

    // Close the menu
    handleClose();
  };

  const addSavedToList = (node: ProseMirrorNode) => {
    // console.log("addSavedToList", node.attrs.id);
    if (isTextNodeEmpty(node)) {
      console.warn("Cannot save empty node.");
      return;
    }
    const content = node.toJSON();
    setSavedList([...savedList, content]);
  };

  useEffect(() => {
    // // console.log("BlockNodeView mounted or updated.", node.toJSON());
    // console.log("BlockNodeView mounted or updated called.");
    if (!node.attrs.id) {
      // console.log(
      //   "BlockNodeView: generating id for node with no id",
      //   node.attrs
      // );
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

  // const handleOpenEditorOld = (node: any) => {
  //   const store = BlockStore.getInst();
  //   let currentDoc = editor.getJSON();

  //   let ctxStack = store.get().ctxStack;
  //   ctxStack[getBlockIdLevel(node.attrs.id)] = currentDoc;

  //   let content = node.attrs.children;

  //   if (content === null || content === undefined) {
  //     let thisNode = node.toJSON();
  //     thisNode = _.cloneDeep(thisNode);
  //     thisNode.attrs.id = node.attrs.id + ".1";

  //     content = [thisNode];

  //     let currentContent: JSONContent[] | undefined = currentDoc.content;
  //     if (
  //       currentContent &&
  //       currentContent.length > 0 &&
  //       thisNode.attrs.role != "system"
  //     ) {
  //       let possibleSystemNode = currentContent[0];
  //       if (possibleSystemNode?.attrs?.role === "system") {
  //         possibleSystemNode = _.cloneDeep(possibleSystemNode);
  //         if (possibleSystemNode && possibleSystemNode.attrs) {
  //           possibleSystemNode.attrs.id = node.attrs.id + ".0";
  //           content.unshift(possibleSystemNode);
  //         }
  //       }
  //     }
  //   }

  //   pushSubContent(editor, content);
  // };

  const handleOpenEditor = (node: any) => {
    const store = BlockStore.getInst();
    let currentDoc = editor.getJSON();

    if (!currentDoc.content) {
      return;
    }

    let ctxStack = store.get().ctxStack;
    ctxStack[getBlockIdLevel(node.attrs.id)] = currentDoc;

    let content = node.attrs.children;

    if (content) {
      pushSubContent(editor, content);
      return;
    }

    content = [];

    for (let i = 0; i < currentDoc.content.length; i++) {
      const element = currentDoc.content[i];
      if (!element) {
        continue;
      }

      console.log("element", JSON.stringify(element));

      let thisNode = _.cloneDeep(element);

      if (thisNode.attrs) {
        thisNode.attrs.id = element.attrs?.id
          ? element.attrs.id + `.${i}`
          : `0.${i}`;
      } else {
        thisNode.attrs = {
          id: `0.${i}`,
        };
      }

      content.push(thisNode);

      if (element.attrs?.id === node.attrs.id) {
        break;
      }
    }

    // console.log(`content ${JSON.stringify(content)}`);

    pushSubContent(editor, content);
    return;
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
    <NodeViewWrapper
      as="div"
      className={`common-block ${node.attrs.role}-block `}
    >
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
            <div className="italic opacity-25 text-xs mt-1 pl-2">
              {node.attrs.id}
            </div>
          </div>

          <div className="flex gap-2">
            {node.attrs.role !== data && (
              <button
                onClick={handleClick}
                className="d-block-button group-hover:opacity-100 p-0"
              >
                <MoreVertIcon className=" icon-size" />
              </button>
            )}
            <Menu
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => selectRole("user")}>Role User</MenuItem>
              <MenuItem onClick={() => selectRole("assistant")}>
                Assistant
              </MenuItem>
              <MenuItem onClick={() => selectRole("system")}>System</MenuItem>
              <MenuItem onClick={() => selectRole("thought")}>Thought</MenuItem>
              <MenuItem onClick={() => selectRole("static")}>Static</MenuItem>
            </Menu>
            <button
              type="button"
              className="d-block-button group-hover:opacity-100 "
              title="Save snippet for later re-use"
              onMouseDown={() => {
                // console.log("Button was clicked.");
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
          <NodeViewContent className="node-view-content w-full pl-2 pr-2 max-w-none prose dark:prose-invert" />
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
          <div className="ml-1 mt-1 ">
            <div>
              {data.report_title &&
                data.company_name &&
                data.company_ticker && (
                  <div>
                    <strong>Report:</strong> {data.report_title},{" "}
                    {data.company_name} ({data.company_ticker})
                  </div>
                )}
              <div>
                <strong>Category:</strong> {data.category}
                {" - "}
                {data.subcategory}
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
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MemoizedBlockNodeView = React.memo(BlockNodeView, areEqual);
