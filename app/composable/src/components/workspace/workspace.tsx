import TipTap from "@/components/editor";
import { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DataItem } from "@/lib/types";
import SearchColumn from "./searchColumn";
import SavedItems from "./savedItems";
import { JSONContent } from "@tiptap/react";
import Catalog from "@/components/workspace/catalog";

type WorkspaceProps = {};

export default function Workspace({}: WorkspaceProps) {
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (slug && slug !== "") {
      setShowCatalog(true);
    } else {
      setShowCatalog(false);
    }
  }, [slug]);

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
      // console.log("here");
      tiptapRef.current.appendContentNodeToEnd(content);
    } else {
      console.log("not here");
    }
  };

  const handleToggleCatalog = () => {
    // New function to toggle Catalog visibility
    console.log("handleToggleCatalog..");
    setShowCatalog(!showCatalog);
  };

  return (
    <div className="flex p-0 w-full border-gray-300 border border-dashed rounded-lg overflow-auto flex-grow h-full">
      {/* TipTap Component */}
      <div className="flex flex-col w-2/3 min-w-[36ch]">
        {showCatalog && <Catalog onToggleCatalog={handleToggleCatalog} />}
        <TipTap ref={tiptapRef} onToggleCatalog={handleToggleCatalog} />
      </div>

      {/* SearchColumn Component */}
      <div className="flex-grow w-1/3 min-w-[22ch]">
        <SavedItems handleAddSaved={handleAddSaved} />
        {/* <SearchColumn handleAddData={handleAddData} /> */}
      </div>
    </div>
  );
}
