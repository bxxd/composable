import React from "react";
import { JSONContent } from "@tiptap/react";

interface SavedItemsProps {
  handleAddSaved: (content: JSONContent) => void;
}

const SavedItems: React.FC<SavedItemsProps> = ({ handleAddSaved }) => {
  return <div className="flex w-full">test</div>;
};

export default SavedItems;
