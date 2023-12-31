"use client";

import "@/styles/editor.scss";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { EditorBubbleMenu } from "./bubble-menu";

import { EditorView } from "prosemirror-view";
import { Transaction } from "prosemirror-state";

import { Editor } from "@tiptap/core";
import { Slice } from "prosemirror-model";
import { defaultExtensions } from "./extensions";
import { HandleAIButtonClickParams } from "./extensions/block";
import { useLatestContextValue } from "@/lib/context";
import { DataItem } from "@/lib/types";
import { extractAllText } from "@/lib/dataUtils";

import _ from "lodash";

import {
  createNodeJSON,
  BlockStore,
  popSubContent,
  isTextNodeEmpty,
  generateBlockId,
  rewriteBlockIdsWithParentId,
  fixIds,
} from "@/lib/editor";
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon
import { JSONContent } from "@tiptap/react";

import { Icon } from "@iconify/react";

import { useCompletion, useChat, Message } from "ai/react";

import { toast } from "sonner";

import { initData, introData, mockData, clearData } from "./samples";

function extractMessagesFromJSON(
  data: JSONContent | null
): { role: string; content: string }[] {
  console.log(`extractMessagesFromJSON: ${JSON.stringify(data)}`);
  let result: { role: string; content: string }[] = [];

  if (!data || !data.content || !Array.isArray(data.content)) {
    return result;
  }

  let currentRole = "";
  let blockContent = "";

  for (let item of data.content) {
    let role = item.attrs && item.attrs.role ? item.attrs.role : "user";
    let newText = "";

    if (item.type === "dBlock" && item.content && Array.isArray(item.content)) {
      if (role === "data") {
        let dataItem = item.attrs?.data as DataItem;
        if (dataItem) {
          let excerpt = dataItem.excerpt;
          if (
            dataItem.report_title &&
            dataItem.company_name &&
            dataItem.company_ticker
          ) {
            excerpt = `${dataItem.report_title} - ${dataItem.company_name} (${dataItem.company_ticker}): ${excerpt}`;
          }
          if (excerpt) {
            newText = excerpt;
          }
        }
      } else {
        newText = extractAllText(item);
      }

      if (newText) {
        newText = newText.trim();
        if (role == "static") {
          role = "assistant";
        } else if (
          role !== "user" &&
          role !== "assistant" &&
          role !== "system"
        ) {
          role = "user";
        }

        console.log(`role: ${role} content: ${blockContent}`);

        if (blockContent && currentRole && role !== currentRole) {
          result.push({
            role: currentRole,
            content: blockContent.trim(),
          });
          blockContent = "";
        }

        currentRole = role;
        if (blockContent) {
          blockContent += " \n\n";
        }
        blockContent += newText;
      }
    }
  }

  if (blockContent) {
    result.push({
      role: currentRole,
      content: blockContent.trim(),
    });
  }

  return result;
}

const insertSegmentsWithHardBreaks = (editor: Editor, diff: string) => {
  const segments = diff.split("\n");
  // console.log(`diff: '${diff}' segments: '${segments}'`);

  segments.forEach((segment, index) => {
    if (segment) {
      // Insert the segment text
      // console.log(`** inserting segment: '${segment}'`);
      setTimeout(() => {
        const transaction = editor.state.tr.insertText(segment);
        editor.view.dispatch(transaction);
      }, 0);
    }

    // Insert a hard break except after the last segment
    if (index < segments.length - 1) {
      // console.log(`** inserting hard break`);
      setTimeout(() => {
        editor.commands.setHardBreak();
      }, 0);
    }
  });
};

const insertSegmentsWithHardBreaksView = (
  editorView: EditorView,
  diff: string
) => {
  const segments = diff.split("\n");

  let tr: Transaction;
  let schema: any;
  let dispatch;

  ({ tr, schema } = editorView.state);
  dispatch = editorView.dispatch;

  segments.forEach((segment, index) => {
    if (segment) {
      tr.insertText(segment);
    }

    if (index < segments.length - 1) {
      tr.insert(tr.selection.from, schema.nodes.hardBreak.create());
    }
  });

  // Dispatch the transaction after all changes have been batched
  dispatch(tr);
};

function handlePaste(view: EditorView, event: ClipboardEvent, slice: Slice) {
  // console.log("handlePaste");

  event.preventDefault();

  const plainText = event.clipboardData?.getData("text/plain");

  if (!plainText) {
    return false;
  }

  insertSegmentsWithHardBreaksView(view, plainText);

  return true;
}

type TipTapProps = {
  onToggleCatalog: () => void;
};

const TipTap = forwardRef((props: TipTapProps, ref: React.Ref<any>) => {
  const { onToggleCatalog } = props;

  const [saveStatus, setSaveStatus] = useState("Saved");

  const [hydrated, setHydrated] = useState(false);

  const aiModelRef = useLatestContextValue("aiModel");

  const editorRef = useRef<Editor | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  // console.log("re-rendering TipTap");

  const blockState = BlockStore.getInst(slug);

  const router = useRouter();

  // console.log(`params ${JSON.stringify(params)}`);
  // console.log("slug", slug);

  const fetchContentData = async (id: string) => {
    // console.log("fetching content data for id: ", id);
    try {
      const res = await fetch(`/api/blob?id=${id}&original`);
      const data = await res.json();
      // console.log("got data", data);

      return data[0];
    } catch (error) {
      toast(`Error fetching content data: ${error}`);
      return [];
    }
  };

  const saveUpdates = useDebouncedCallback(async () => {
    console.log("saveUpdates..");
    setSaveStatus("Saving...");

    // Simulate a delay in saving.

    if (isLoading) {
      console.log("AI is busy, not saving.");
      return;
    }
    const json = editorRef.current?.getJSON();

    if (!json) {
      console.warn("no json to save, editor:", editorRef.current);
      return;
    }
    blockState.setCtxItemAtLevel(blockState.get().level, json);
    console.log("Saved.");
    setSaveStatus("Saved");
  }, 1000);

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    appendDataContentToEnd: appendDataContentToEnd,
    appendContentNodeToEnd: appendContentNodeToEnd,
  }));

  const handleAIButtonClick = ({ editor }: HandleAIButtonClickParams) => {
    let currentEditor = editor || editorRef.current;

    if (!currentEditor) {
      return; // Handle case where the local editor is also not set
    }
    console.log("handleAIButtonClick");
    if (isLoading) {
      toast("AI is busy...");
      return;
    }

    prev.current = "";
    newNodePosition.current = null;
    let data = currentEditor?.getJSON();

    // console.log("editor", currentEditor);
    console.log("json", JSON.stringify(data));

    data = extractMessagesFromJSON(data);

    console.log("data", JSON.stringify(data));

    let payload = { messages: data, aiModel: aiModelRef.current };

    toast.message(`Sending to AI ${aiModelRef.current}...`);
    console.log(`Sending to AI... ${aiModelRef.current}`);
    // console.log("payload ", payload);

    complete(JSON.stringify(payload));
    // toast(`aiModel: ${aiModelRef.current}`);
  };

  const editor = useEditor({
    extensions: defaultExtensions(handleAIButtonClick),
    content: {
      type: "doc",
      content: initData,
    },
    editorProps: {
      attributes: {
        class: `prose-p:my-2 prose-h1:my-2 prose-h2:my-2 prose-h3:my-2 prose-ul:my-2 prose-ol:my-2 max-w-none w-full focus:outline-none`,
        spellcheck: "false",
        suppressContentEditableWarning: "true",
      },
      handlePaste: handlePaste,
    },
    onUpdate: (e) => {
      setSaveStatus("Unsaved");

      saveUpdates();
    },
    autofocus: "end",
  });

  useEffect(() => {
    // console.log("useEffect setting editorRef");
    editorRef.current = editor;
  }, [editor]);

  const { complete, completion, isLoading, stop } = useCompletion({
    api: "/api/generate",
    onFinish: (_prompt, _completion) => {
      // console.log("AI finished", editor);
      saveUpdates();

      toast("AI finished.");

      if (editor) {
        editor.setOptions({ editable: true });
      }
    },
    onError: (error) => {
      console.log("error", error);
      toast(error.message);
    },
  });

  const prev = useRef("");
  const newNodePosition = useRef<number | null>(null);

  useEffect(() => {
    // if user presses escape or cmd + z and it's loading,
    // stop the request, delete the completion, and insert back the "++"
    // console.log("useEffect setting up event listeners");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.metaKey && e.key === "z")) {
        stop();
        if (e.key === "Escape") {
          editor?.commands.deleteRange({
            from: editor.state.selection.from - completion.length,
            to: editor.state.selection.from,
          });
        }
      }
    };
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      //   stop();

      toast("Editing disabled while AI is responding.");
    };

    const element = componentRef.current;
    if (element) {
      if (isLoading) {
        document.addEventListener("keydown", onKeyDown);
        element.addEventListener("mousedown", mousedownHandler);
      } else {
        document.removeEventListener("keydown", onKeyDown);
        element.removeEventListener("mousedown", mousedownHandler);
      }
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        element.removeEventListener("mousedown", mousedownHandler);
      };
    }
  }, [stop, isLoading, editor, complete, completion.length]);

  useEffect(() => {
    // console.log("useEffect completion");
    if (!editor) {
      return;
    }

    if (!hydrated) {
      // this is to prevent it from redoing the completion on some bug in saved state on going back into page
      prev.current = completion;
      return;
    }

    let diff = completion.slice(prev.current.length);
    if (!diff) {
      return;
    }

    // console.log("received diff from ", completion);

    prev.current = completion;

    // console.log("diff", diff);
    if (newNodePosition.current === null) {
      const newNodeJSON = createNodeJSON("", "assistant", editorRef.current);
      // Get the position of the last node
      const lastNode = editor.state.doc.lastChild;
      let position = editor.state.doc.content.size;

      // If the last node is empty, adjust the position
      if (lastNode && isTextNodeEmpty(lastNode)) {
        position -= lastNode.nodeSize;
      } else {
      }

      setTimeout(() => {
        editor.commands.insertContentAt(position, newNodeJSON);
      }, 0);

      insertSegmentsWithHardBreaks(editor, diff);
      newNodePosition.current = position;
    } else {
      insertSegmentsWithHardBreaks(editor, diff);
    }
  }, [isLoading, editor, completion, hydrated]);

  const appendContentNodeToEnd = (content: JSONContent) => {
    if (!editor) {
      return;
    }

    // console.log("appendContentNodeToEnd..");

    let newContent = _.cloneDeep(content);

    if (newContent.type === "dBlock" && newContent.attrs) {
      newContent.attrs.id = generateBlockId(editor);
    }

    const lastNode = editor.state.doc.lastChild;
    let position = editor.state.doc.content.size;
    if (lastNode && isTextNodeEmpty(lastNode)) {
      position -= lastNode.nodeSize;
    }
    setTimeout(() => {
      editor.commands.insertContentAt(position, newContent);
    }, 0);

    if (newContent.attrs) {
      newContent.attrs.id = generateBlockId(editor);

      newContent.attrs.children = rewriteBlockIdsWithParentId(
        newContent.attrs.children,
        newContent.attrs.id
      );
    } else {
      console.warn("no attrs on node appending!", newContent.toJSON());
    }

    saveUpdates();
  };

  useEffect(() => {
    // console.log("being called useEffect hydrated");
    if (editor) {
      setTimeout(() => {
        if (!blockState.loadFromLocalStorage()) {
          console.log(
            "No data found in localStorage, initializing with default values..."
          );
          if (!slug) {
            console.log("No slug, initializing with introData...");
            blockState.setCtxItemAtLevel(1, introData);
            editor.commands.setContent(introData);
          } else {
            console.log("Slug found, initializing...");
            const fetchData = async () => {
              const data = await fetchContentData(slug);

              if (!data) {
                console.log("no data found for slug");
                blockState.setCtxItemAtLevel(1, introData);
                editor.commands.setContent(introData);
              } else {
                setTimeout(() => {
                  console.log("setting data to", JSON.stringify(data.original));
                  fixIds(data.original);
                  blockState.setCtxItemAtLevel(1, data.original);
                  editor.commands.setContent(data.original);
                }, 0);
              }
              console.log("done hydrating");
            };
            fetchData();
          }
        } else {
          console.log(
            "Data found in localStorage, initializing with values..."
          );
          let data = blockState.getCtxItemAtCurrentLevel();
          console.log("setting data to", JSON.stringify(data));
          // fixIds(data);
          editor.commands.setContent(data);
        }
      }, 0);
      setHydrated(true);
      editorRef.current = editor;
    }
  }, [editor, setHydrated, saveUpdates, slug, blockState]);

  const appendDataContentToEnd = (data: DataItem) => {
    if (!editor) {
      console.log("no editor");
      return;
    }
    // console.log("appendDataContentToEnd..");
    const newNodeJSON = createNodeJSON(data, "data", editorRef.current);

    // Get the position of the last node
    const lastNode = editor.state.doc.lastChild;
    let position = editor.state.doc.content.size;

    // If the last node is empty, adjust the position
    if (lastNode && isTextNodeEmpty(lastNode)) {
      position -= lastNode.nodeSize;
    }

    editor.commands.insertContentAt(position, newNodeJSON);

    saveUpdates();
  };

  const clearEditor = () => {
    blockState.set({ level: 1, lastId: null, ctxStack: { "1": clearData } });
    setTimeout(() => {
      editor?.commands.setContent(clearData);
    }, 0);
    saveUpdates();
  };

  const handleSubLevelCloseClick = () => {
    popSubContent(editorRef.current, false);
  };

  const handleSubLevelAcceptClick = () => {
    popSubContent(editorRef.current, true);
  };

  return (
    <section
      // className="flex flex-col border border-dashed rounded-lg m-1 p-1 pt-1 pb-0  border-sky-300"
      className="flex flex-col rounded-lg m-1 pt-1 pr-1 pl-0 pb-1  mb-20"
      ref={componentRef}
    >
      <div className="header flex justify-end pb-1">
        <button
          type="button"
          className="cursor-pointer"
          onMouseDown={onToggleCatalog}
          title="Show or Hide the Catalog."
        >
          <Icon icon="ph:books-thin" width={21} height={21} color="#aaa" />
        </button>

        <div className="flex mr-auto pt-1">
          <div className="ml-1 text-stone-400  text-sm font-normal">
            {slug === null || slug.length == 0 ? <>Home</> : <>{slug}</>}
          </div>
          <div className="ml-2 text-stone-400  text-sm italic">
            - level {blockState.get().level}
          </div>
        </div>
        <button
          type="button"
          onMouseDown={() => router.push("/play/" + slug)}
          className="mr-1"
          title="Play as if it was a script."
        >
          <Icon icon="ph:play-light" width={21} height={21} color="#aaa" />
        </button>
        <button
          type="button"
          onMouseDown={() => router.push("/publish/" + slug)}
          className="mr-1"
          title="Publish to the world."
        >
          <Icon
            icon="ph:share-network-thin"
            width={21}
            height={21}
            color="#aaa"
          />
        </button>
        <div className="rounded-lg bg-stone-100 px-2 py-1 text-sm text-stone-400 inline-block ">
          {saveStatus}
        </div>
        {blockState.get().level > 1 && (
          <>
            <button
              type="button"
              className="w-6 h-6 bg-red-400 hover:bg-red-500 active:bg-red-600 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 dark:text-white"
              onMouseDown={handleSubLevelCloseClick}
              title="Close sub context and discard changes."
            >
              {/* <Icon icon="ant-design:close-circle-outlined" color="white" /> */}
              <Icon icon={baselineChevronLeft} color="white" />
            </button>
            <button
              type="button"
              className="w-6 h-6 bg-green-400 hover:bg-green-500 active:bg-green-600 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5 dark:bg-green-700 dark:hover:bg-green-800 dark:active:bg-green-900 dark:text-white"
              onMouseDown={handleSubLevelAcceptClick}
              title="Close sub context and accept changes."
            >
              <Icon icon="ant-design:check-circle-outlined" color="white" />
            </button>
          </>
        )}
      </div>
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent className="" editor={editor} />
      <div className="relative group inline-block mt-2">
        <div className="flex ">
          <button
            type="button"
            className=" w-6 h-6 bg-red-200 hover:bg-red-300 active:bg-red-400 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5 dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-500 dark:text-gray-300"
            onMouseDown={() => clearEditor()}
            title="Reset all context"
          >
            <Icon
              icon="ant-design:close-circle-outlined"
              className="icon-size"
            />
          </button>
          <button
            type="button"
            className="mr-auto w-6 h-6 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-300"
            onMouseDown={() =>
              handleAIButtonClick({ editor: editorRef.current })
            }
            title="Send context to AI"
          >
            <Icon icon="ant-design:down" className="icon-size" />
          </button>
        </div>
      </div>
    </section>
  );
});

TipTap.displayName = "TipTap";

export default TipTap;
