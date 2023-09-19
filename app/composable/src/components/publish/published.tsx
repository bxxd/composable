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
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<any>(null);

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
      // console.log("data", data);
      setData(data[0]);
      return data[0];
    } catch (error) {
      toast(`Error fetching content data: ${error}`);
      return [];
    }
  };

  useEffect(() => {
    if (editor) {
      const fetchData = async () => {
        const data = await fetchContentData(id);

        const contentArray = data.data;
        setTimeout(() => {
          editor.commands.setContent(contentArray);
        }, 0);
        console.log("done hydrating");
      };
      fetchData();
      setHydrated(true);
    }
  }, [editor, id, setHydrated]);

  const router = useRouter();

  return (
    <>
      {/* TipTap Component */}
      <div
        className="flex flex-col w-full"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm">
          <div>
            <button onMouseDown={copyToClipboard}>
              <Icon icon="ph:link-thin" width={21} height={21} color="#aaa" />
            </button>
            {data?.original && (
              <button
                onClick={() => router.push(`/work/${id}`)}
                className="ml-2"
              >
                <Icon
                  icon="iconamoon:edit-thin"
                  width={21}
                  height={21}
                  color="#aaa"
                />
              </button>
            )}
          </div>
          <div className="text-sm opacity-25 italic">
            {data?.id} Created by {data?.ai_model}
          </div>
        </div>
        <EditorContent
          editor={editor}
          className="rounded-lg p-2 leading-relaxed outline-none "
        />
      </div>
    </>
  );
};

export default Published;
