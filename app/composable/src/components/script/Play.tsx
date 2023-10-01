"use client";

import "@/styles/script.scss";

import React, { useEffect, useState } from "react";
import { BlockStore } from "@/lib/editor";
import { useRouter, useParams } from "next/navigation";
import { JSONContent, useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { Editor } from "@tiptap/core";
import { extractAllText } from "@/lib/editor";
// import { CSSTransition } from "react-transition-group";
import { Icon } from "@iconify/react";
import FadeIn from "react-fade-in";
import { useCompletion } from "ai/react";
import { toast } from "sonner";
import { useLatestContextValue, useGlobalContext } from "@/lib/context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type Message = { role: string; content: string };

type ScriptItem = {
  role: string;
  id: string;
  content?: any; // Keeping it as 'any' to retain its original structure
  excerpt?: string;
  html?: string; // This is the HTML representation of the content
  text?: string;
};

const getEditorHtml = (content: any) => {
  const editor = new Editor({
    extensions: publishedExtensions,
    content: { type: "doc", content: content },
  });

  const html = editor.getHTML();

  // Don't forget to destroy the editor instance to avoid memory leaks
  editor.destroy();

  return html;
};

const reduceToScript = (blocks: JSONContent[]): ScriptItem[] => {
  const result: ScriptItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const { attrs, content } = block;
    const role = attrs?.role;
    const id = attrs?.id;

    let excerpt;
    if (attrs?.data && attrs.data.excerpt) {
      excerpt = attrs.data.excerpt;
    }

    let html;
    if (role === "static") {
      html = getEditorHtml(content);
      console.log("html", html);
    }

    result.push({
      role,
      id,
      content, // Retained the original structure
      excerpt,
      html,
    });
  }

  return result;
};

export type PlayProps = {};

const Play: React.FC<PlayProps> = () => {
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }
  const [hydrated, setHydrated] = useState(false);
  const [isFirst, setIsFirst] = useState(false);
  // const [showAI, setShowAI] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [script, setScript] = useState<ScriptItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentItem, setCurrentItem] = useState<ScriptItem | null>(null);
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false);

  const [displayedItems, setDisplayedItems] = useState<ScriptItem[]>([]);
  const [displayUserInput, setDisplayUserInput] = useState(false);
  // const [userInput, setUserInput] = useState<string | null | undefined>(null);
  const aiModelRef = useLatestContextValue("aiModel");

  const { setAiModel } = useGlobalContext();

  // const [aiWasLast, setAiWasLast] = useState(false);

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

  const { complete, completion, isLoading, stop } = useCompletion({
    api: "/api/generate",
    onResponse: (response) => {
      console.log("onResponse response is", response);
      console.log("currentItem", currentItem);

      setDisplayUserInput(false);
      if (currentItem) {
        displayedItems.push({
          role: "user",
          id: currentItem.id + "_user",
          html: editor?.getHTML(),
          content: editor?.getJSON(),
        });

        displayedItems.push(currentItem);

        setDisplayedItems(displayedItems);
      }

      // next();
    },
    onFinish: (_prompt, _completion) => {
      // console.log("AI finished", editor);
      console.log("AI finished", _completion, currentItem);
      if (currentItem) {
        currentItem.text = _completion;
        setCurrentItem(currentItem);
        // setAiWasLast(true);
        next();
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: _completion,
        },
      ]);

      toast("AI finished.");
    },
    onError: (error) => {
      console.log("error", error);
      toast(error.message);
    },
    body: {
      aiModel: aiModelRef.current,
    },
  });

  const blockState = BlockStore.getInst(slug);

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: `prose-p:my-2`,
      },
    },
    extensions: publishedExtensions,
    editable: true,
  });

  function next() {
    setCurrentIndex(currentIndex + 1);
  }

  const applyDelay = (action: () => void) => {
    if (isFirst) {
      action();
      setIsFirst(false);
    } else {
      setTimeout(() => {
        action();
        setIsFirst(false);
      }, 500);
    }
  };

  const playNext = () => {
    console.log("playNext");

    if (displayUserInput) {
      setDisplayUserInput(false);
    }

    let item = script[currentIndex];

    if (!item) {
      console.log("No item found");
      if (currentItem?.role === "static") {
        console.log("last role is static");
      } else {
        let fake = {
          role: "assistant",
          id: currentItem?.id || "" + "_assistant" + Math.random(),
        };
        applyDelay(() => {
          editor?.commands.clearContent();
          setDisplayUserInput(true);
          setCurrentItem(fake);
        });
      }
      return;
    }

    console.log("item", JSON.stringify(item));

    if (item.role === "user") {
    } else {
      setCurrentItem(item);
    }
    switch (item.role) {
      case "static":
        console.log("static");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: extractAllText(item.content),
          },
        ]);
        applyDelay(() => {
          setDisplayedItems((prevItems) => [...prevItems, item]);
          setIsFirst(false);
          next();
        });

        break;
      case "user":
        console.log("user");
        next();
        break;
      case "system":
        console.log("system");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "system",
            content: extractAllText(item.content),
          },
        ]);
        next();
        break;
      case "thought":
        console.log("thought");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: extractAllText(item.content),
          },
        ]);
        next();
        break;
      case "assistant":
        console.log("assistant");

        item.text = "";

        applyDelay(() => {
          editor?.commands.clearContent();
          setDisplayUserInput(true);
        });
        break;
      case "data":
        console.log("data");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "user",
            content: "DATA: " + item.excerpt,
          },
        ]);
        next();
        break;

      default:
        console.log("default", item.role);
    }
  };

  useEffect(() => {
    if (currentItem) {
      currentItem.text = completion;
      setCurrentItem(currentItem);
    }
  }, [completion, currentItem]);

  const handleAIButtonClick = ({ editor }: { editor: Editor | null }) => {
    console.log("handleAIButtonClick...");
    let text = editor?.storage.markdown.getMarkdown() || "";

    console.log("text", text);

    if (!text || text.length <= 0) {
      toast.error("Please enter something.");
      return;
    }

    messages.push({ role: "user", content: text });

    complete(JSON.stringify(messages));
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (hydrated) {
      playNext();
      console.log(`messages: ${JSON.stringify(messages)}`);
    }
  }, [currentIndex, hydrated]);

  useEffect(() => {
    if (blockState.loadFromLocalStorage()) {
      setLoadedFromLocalStorage(true);
      let jsonData: JSONContent[] = blockState.getCtxItemAtCurrentLevel();

      let script = reduceToScript(jsonData);
      setScript(script);

      console.log("jsonData", JSON.stringify(script));

      // Simulating data fetching or some setup here
      setHydrated(true);
    } else if (slug.length >= 0) {
      console.log("Slug found, initializing...");
      const fetchData = async () => {
        console.log("fetching data for slug", slug);
        const data = await fetchContentData(slug);
        if (!data) {
          console.log("no data found for slug");
          toast.error("No data found for this id");
        } else {
          let script = reduceToScript(data.original);
          console.log("script", script);
          console.log("setting ai model", data.ai_model);
          setAiModel(data.ai_model);
          setScript(script);
        }
        setHydrated(true);
      };
      fetchData();
    } else {
      toast.error("Error.");
      setHydrated(true);
    }
  }, [setHydrated, setScript, blockState, slug, setAiModel]);

  // useEffect(() => {
  //   if (!hydrated) {
  //     return;
  //   }

  //   console.log("script", script);

  //   if (script.length === 0) {
  //     return;
  //   }

  //   playNext();
  // }, [hydrated]);

  const router = useRouter();

  if (!hydrated) {
  }

  console.log(
    `hydrated: ${hydrated} displayUserInput: ${displayUserInput} currentIndex: ${currentIndex} currentItem: {id: ${currentItem?.id}, role: ${currentItem?.role}}`
  );

  // console.log("completion", completion);

  return (
    <>
      {!loadedFromLocalStorage && (
        <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm ">
          <button onMouseDown={() => router.push("/work/" + slug)}>
            <Icon
              icon="iconamoon:edit-thin"
              width={21}
              height={21}
              color="#aaa"
            />
          </button>
        </div>
      )}
      <div className="space-y-4 p-4 rounded-lg  bg-gray-50 dark:bg-gray-900">
        {displayedItems.map((item, index) => (
          <React.Fragment key={item.id + index}>
            <>
              {item.role == "assistant" ? (
                <FadeIn>
                  <div className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 max-w-2xl">
                    <div className="">
                      <Icon icon="mdi:robot" className="icon-size mr-2" />
                      <ReactMarkdown
                        className="prose"
                        remarkPlugins={[remarkGfm]}
                      >
                        {item.text || ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                </FadeIn>
              ) : item.role === "user" ? (
                <div className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 max-w-2xl">
                  <Icon
                    icon="mdi-light:chevron-right"
                    className="icon-size mr-2"
                  />
                  <div
                    className="prose dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: item.html || "" }}
                  ></div>
                </div>
              ) : (
                <FadeIn>
                  <div className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 max-w-2xl">
                    <Icon icon="mdi:robot" className="icon-size mr-2" />
                    <div
                      className="prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: item.html || "" }}
                    ></div>
                  </div>
                </FadeIn>
              )}
            </>
          </React.Fragment>
        ))}

        {displayUserInput && (
          <FadeIn>
            <div className="max-w-2xl">
              <div className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 ">
                <EditorContent
                  editor={editor}
                  className="prose dark:prose-invert w-full rounded-lg p-2 leading-relaxed outline-none "
                />
              </div>

              <button
                type="button"
                className="ml-auto mt-1 w-6 h-6 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-md focus:outline-none transition duration-150 ease-in-out flex items-center justify-center m-0.5 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-300"
                onMouseDown={() => {
                  handleAIButtonClick({ editor });
                }}
                title="Send context to AI"
              >
                <Icon
                  icon="ant-design:down"
                  className="icon-size"
                  color="green"
                />
              </button>
            </div>
          </FadeIn>
        )}
      </div>
    </>
  );
};

export default Play;
