import TipTap from "@/components/editor";
import { useRef } from "react";
import { DataItem } from "@/lib/types";
import SearchColumn from "./searchColumn";
import SavedItems from "./savedItems";
import { JSONContent } from "@tiptap/react";

type WorkspaceProps = {};

export default function Workspace({}: WorkspaceProps) {
  const tiptapRef = useRef<{
    getEditor: () => { commands: { setContent: (content: string) => void } };
    appendDataContentToEnd?: (content: DataItem) => void;
    appendContentNodeToEnd?: (content: JSONContent) => void;
  } | null>(null);

  const handleAddData = (content: DataItem) => {
    if (tiptapRef.current?.appendDataContentToEnd) {
      tiptapRef.current.appendDataContentToEnd(content);
    }
  };

  const handleAddSaved = (content: JSONContent) => {
    console.log("handleAddSaved", content);
    console.log("tiptapRef", tiptapRef.current);
    if (tiptapRef.current?.appendContentNodeToEnd) {
      console.log("here");
      tiptapRef.current.appendContentNodeToEnd(content);
    } else {
      console.log("not here");
    }
  };

  return (
    <div className="flex p-0 w-full border-gray-300 border border-dashed rounded-lg overflow-auto">
      {/* TipTap Component */}
      <div className="flex flex-col w-2/3 min-w-[41ch]">
        <TipTap ref={tiptapRef} />
      </div>

      {/* SearchColumn Component */}
      <div className="flex-grow w-1/3 min-w-[22ch]">
        <SavedItems handleAddSaved={handleAddSaved} />
        <SearchColumn handleAddData={handleAddData} />
      </div>
    </div>
  );
}
