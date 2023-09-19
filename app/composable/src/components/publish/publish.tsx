import "./styles.scss";

import React from "react";
import { BlockStore } from "@/lib/editor";

import { useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { Icon } from "@iconify/react";
import { useLatestContextValue } from "@/lib/context";
import { EditorBubbleMenu } from "@/components/editor/bubble-menu";
import { useEffect, useRef, useState } from "react";
import { JSONContent } from "@tiptap/react";
import { useRouter, useParams } from "next/navigation";

type PublishProps = {
  isEditable?: boolean;
};

const Publish: React.FC<PublishProps> = ({ isEditable = true }) => {
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  const blockState = BlockStore.getInst(slug);

  const [hydrated, setHydrated] = useState(false);

  const [activeToggle, setActiveToggle] = useState("Assistant");

  const contentArrayRef = useRef<JSONContent[]>([]);

  const aiModelRef = useLatestContextValue("aiModel");

  const editor = useEditor({
    extensions: publishedExtensions,
    editable: isEditable,
  });

  useEffect(() => {
    if (editor) {
      blockState.loadFromLocalStorage();

      let jsonData: JSONContent = blockState.getCtxItemAtCurrentLevel();

      if (!jsonData) {
        editor.commands.setContent([]);
        return;
      }

      console.log("jsonData", JSON.stringify(jsonData));

      let filteredJsonData =
        activeToggle.toLowerCase() !== "all"
          ? jsonData.filter(
              (item: any) =>
                item.attrs?.role?.toLowerCase() === activeToggle.toLowerCase()
            )
          : jsonData;

      let contentArray = filteredJsonData.reduce(
        (acc: JSONContent[], item: JSONContent) => {
          return item.content ? acc.concat(item.content) : acc;
        },
        []
      );

      console.log("contentArray", JSON.stringify(contentArray));

      contentArrayRef.current = contentArray;

      console.log("hydrating..", contentArray);
      setTimeout(() => {
        editor.commands.setContent(contentArray);
        console.log("done hydrating");

        const markdownOutput = editor.storage.markdown
          .getMarkdown()
          .replace(/\\/g, "")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
        // editor.getText();
        // console.log("markdownOutput", markdownOutput);
        editor?.commands.setContent(markdownOutput);
      }, 0);

      setHydrated(true);
    }
  }, [editor, blockState, activeToggle]);

  const router = useRouter();

  const publishToWorld = async () => {
    try {
      let jsonData: JSONContent = blockState.getCtxItemAtCurrentLevel();

      const response = await fetch("/api/blob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: editor?.getJSON(),
          original: JSON.stringify(jsonData),
          ai_model: aiModelRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const responseBody = await response.json();
      const id = responseBody.id;

      router.push(`/ai-created/${id}`);
    } catch (error) {
      console.error("Error publishing content:", error);
    }
  };

  return (
    <>
      <div className="flex p-0 w-full overflow-auto">
        {/* TipTap Component */}
        <div className="flex flex-col min-w-[36ch]">
          <div className="flex flex-col border-r border-b border-solid rounded-lg m-1 mb-5 pl-5 pr-2  border-gray-100 dark:border-gray-600 ">
            <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm">
              <button onClick={() => router.push("/")}>
                <Icon
                  icon="iconamoon:edit-thin"
                  width={21}
                  height={21}
                  color="#aaa"
                />
              </button>
              <div className="flex space-x-2">
                <button
                  className={`toggleButton ${
                    activeToggle === "Assistant" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("Assistant")}
                >
                  Assistant
                </button>
                <button
                  className={`toggleButton ${
                    activeToggle === "User" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("User")}
                >
                  User
                </button>
                <button
                  className={`toggleButton ${
                    activeToggle === "All" ? "toggleButtonActive" : ""
                  }`}
                  onClick={() => setActiveToggle("All")}
                >
                  All
                </button>
              </div>
              <button onClick={publishToWorld} title="Publish to the world.">
                <Icon
                  icon="ph:share-network-thin"
                  width={21}
                  height={21}
                  color="#aaa"
                />
              </button>
            </div>
            {editor && <EditorBubbleMenu editor={editor} />}
            <EditorContent
              editor={editor}
              className="rounded-lg p-2 leading-relaxed outline-none "
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Publish;
