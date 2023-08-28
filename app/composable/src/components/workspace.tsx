import TipTap from "@/components/editor";
import { useRef, useState } from "react";
import { DataItem } from "@/lib/types";
import SearchColumn from "./searchColumn";

type WorkspaceProps = {};

export default function Workspace({}: WorkspaceProps) {
  const tiptapRef = useRef<{
    getEditor: () => { commands: { setContent: (content: string) => void } };
    appendDataContentToEnd?: (content: DataItem) => void;
  } | null>(null);

  const handleAddData = (content: DataItem) => {
    if (tiptapRef.current?.appendDataContentToEnd) {
      tiptapRef.current.appendDataContentToEnd(content);
    }
  };

  // border-gray-300 border border-dashed rounded-lg m-1
  return (
    <div className="flex p-0 w-full border-gray-300 border border-dashed rounded-lg m-1">
      <div className="flex flex-col flex-grow max-w-[85ch] min-w-[85ch]">
        <TipTap ref={tiptapRef} />
      </div>

      <SearchColumn handleAddData={handleAddData} />
    </div>
  );
}
