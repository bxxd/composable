import TipTap from "@/components/editor";
import { useRef } from "react";
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
    <div className="flex p-0 w-full border-gray-300 border border-dashed rounded-lg m-1 pr-2">
      {/* TipTap Component */}
      <div className="flex flex-col w-2/3 min-w-[85ch] flex-shrink-0">
        <TipTap ref={tiptapRef} />
      </div>

      {/* SearchColumn Component */}
      <div className="flex-grow w-1/3">
        <SearchColumn handleAddData={handleAddData} />
      </div>
    </div>
  );
}
