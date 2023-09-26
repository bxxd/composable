import "@/styles/script.scss";

import React, { useEffect, useState } from "react";
import { BlockStore } from "@/lib/editor";
import { useParams } from "next/navigation";
import { JSONContent, useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { Editor } from "@tiptap/core";
import { extractAllText } from "@/lib/editor";
import { CSSTransition } from "react-transition-group";
import FadeIn from "react-fade-in";

type Messages = {
  role: string;
  content: string;
};

type ScriptItem = {
  role: string;
  id: string;
  content: any; // Keeping it as 'any' to retain its original structure
  excerpt: string | null;
  html?: string | null; // This is the HTML representation of the content
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

    let excerpt: string | null = null;
    if (attrs?.data && attrs.data.excerpt) {
      excerpt = attrs.data.excerpt;
    }

    let html: string | null = null;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [script, setScript] = useState<ScriptItem[]>([]);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [displayedItems, setDisplayedItems] = useState<ScriptItem[]>([]);
  const [displayUserInput, setDisplayUserInput] = useState(false);
  const [userInput, setUserInput] = useState<ScriptItem | null>(null);
  const [displayedItemIDs, setDisplayedItemIDs] = useState<Set<string>>(
    new Set()
  );

  const blockState = BlockStore.getInst(slug);

  const editor = useEditor({
    extensions: publishedExtensions,
    editable: true,
  });

  const playNext = () => {
    console.log("playNext");

    if (displayUserInput) {
      setDisplayUserInput(false);
    }

    let item = script[currentIndex];

    if (!item) {
      console.log("No item found");
      return;
    }

    console.log("item", item);

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
        if (isFirst) {
          setDisplayedItems((prevItems) => [...prevItems, item]);
          setCurrentIndex(currentIndex + 1);
          setIsFirst(false);
        } else {
          setTimeout(() => {
            setDisplayedItems((prevItems) => [...prevItems, item]);
            setCurrentIndex(currentIndex + 1);
          }, 500);
        }

        break;
      case "user":
        console.log("user");
        if (isFirst) {
          editor?.commands.clearContent();
          setDisplayUserInput(true);
          setUserInput(item);
          setIsFirst(false);
        } else {
          setTimeout(() => {
            editor?.commands.clearContent();
            setDisplayUserInput(true);
            setUserInput(item);
            setIsFirst(false);
          }, 500);
        }
        break;
      case "system":
        console.log("system");
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "system", content: extractAllText(item.content) },
        ]);
        setCurrentIndex(currentIndex + 1);
        break;
      case "thought":
        console.log("thought");
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "I think that " + extractAllText(item.content),
          },
        ]);
        setCurrentIndex(currentIndex + 1);
        break;
      default:
        console.log("default", item.role);
    }
  };

  useEffect(() => {
    if (hydrated) {
      playNext();
    }
  }, [currentIndex]);

  useEffect(() => {
    blockState.loadFromLocalStorage();
    let jsonData: JSONContent[] = blockState.getCtxItemAtCurrentLevel();

    let script = reduceToScript(jsonData);
    setScript(script);

    console.log("jsonData", JSON.stringify(script));

    // Simulating data fetching or some setup here
    setHydrated(true);
  }, [setHydrated, setScript]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    console.log("script", script);

    if (script.length === 0) {
      return;
    }

    playNext();
  }, [hydrated]);

  if (!hydrated) {
  }

  console.log(`hydrated: ${hydrated} displayUserInput: ${displayUserInput}`);

  return (
    <>
      <div className="space-y-4 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        {displayedItems.map((item, index) => (
          <FadeIn>
            <div
              key={item.id + index}
              className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: item.html || "" }}
            ></div>
          </FadeIn>
        ))}

        {displayUserInput && (
          <FadeIn>
            <div className="p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100">
              <EditorContent
                editor={editor}
                className="rounded-lg p-2 leading-relaxed outline-none "
              />
            </div>
          </FadeIn>
        )}
      </div>
    </>
  );
};

{
  /* <CSSTransition
in={displayUserInput} // The condition that triggers the transition
timeout={1000} // Matches your 0.5s CSS transition duration
classNames="fade" // Class name prefix
unmountOnExit // Removes the component from the DOM when not displayed
> */
}

export default Play;
