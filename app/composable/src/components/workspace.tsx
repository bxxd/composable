import TipTap from "@/components/editor";
import { useRef, useState } from "react";

import SearchColumn from "./searchColumn";

type WorkspaceProps = {};

export default function Workspace({}: WorkspaceProps) {
  const tiptapRef = useRef<{
    getEditor: () => { commands: { setContent: (content: string) => void } };
    appendContentToEnd?: (content: string) => void;
  } | null>(null);

  const handleAddContent = (content: string) => {
    if (tiptapRef.current?.appendContentToEnd) {
      tiptapRef.current.appendContentToEnd(content);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([
    // Sample data
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ]);

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex p-0 border-gray-300 border border-dashed rounded-lg m-1 w-full">
      <div className="flex flex-col flex-grow max-w-[85ch]">
        <TipTap ref={tiptapRef} />
      </div>

      <SearchColumn handleAddContent={handleAddContent} />
    </div>
  );
}
