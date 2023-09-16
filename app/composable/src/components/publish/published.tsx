import "./styles.scss";

import React from "react";
import { BlockStore } from "@/lib/editor";

import { useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { Icon } from "@iconify/react";

import { useRouter } from "next/navigation";

import { useEffect, useRef, useState } from "react";
import { JSONContent } from "@tiptap/react";

import { toast } from "sonner";

type PublishedProps = { id: string };

const Published: React.FC<PublishedProps> = ({ id }) => {
  const blockState = BlockStore.getInst();

  const [hydrated, setHydrated] = useState(false);

  const contentArrayRef = useRef<JSONContent[]>([]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        console.log("URL copied to clipboard");
        toast("URL copied to clipboard");
      },
      (err) => {
        console.error("Could not copy URL: ", err);
        toast(`Could not copy URL: ${err}`);
      }
    );
  };

  const editor = useEditor({
    extensions: publishedExtensions,
    editable: false,
  });

  const fetchContentData = async (id: string) => {
    console.log("fetching content data for id: ", id);
    try {
      const res = await fetch(`/api/blob?id=${id}`);
      const data = await res.json();
      console.log("data", data);
      return data.data;
    } catch (error) {
      toast(`Error fetching content data: ${error}`);
      return [];
    }
  };

  useEffect(() => {
    if (editor) {
      const fetchData = async () => {
        const contentArray = await fetchContentData(id);
        setTimeout(() => {
          editor.commands.setContent(contentArray);
        }, 0);
      };
      fetchData();
      setHydrated(true);
    }
  }, [editor, id, setHydrated]);

  const router = useRouter();

  return (
    <>
      <div className="flex p-0 w-full overflow-auto">
        {/* TipTap Component */}
        <div className="flex flex-col w-2/3 min-w-[41ch]">
          <div className="flex flex-col border-r border-b border-solid rounded-lg m-1 mb-5 pl-5 pr-2  border-gray-100 dark:border-gray-600 ">
            <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm">
              <div className="">
                {/* <button onClick={() => router.push("/")} className="mr-2">
                  <Icon
                    icon="iconamoon:edit-thin"
                    width={21}
                    height={21}
                    color="#aaa"
                  />
                </button> */}
                <button onMouseDown={copyToClipboard}>
                  <Icon
                    icon="ph:link-thin"
                    width={21}
                    height={21}
                    color="#aaa"
                  />
                </button>
              </div>
            </div>
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

export default Published;
