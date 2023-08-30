import React, { useState, useImperativeHandle, forwardRef } from "react";
import { JSONContent } from "@tiptap/react";

interface SavedItemsProps {
  handleAddSaved: (content: JSONContent) => void;
}

const SavedItems = forwardRef<any, SavedItemsProps>(
  ({ handleAddSaved }, ref) => {
    const [savedList, setSavedList] = useState<JSONContent[]>([]);

    const addSavedToList = (content: JSONContent) => {
      setSavedList([...savedList, content]);
    };

    useImperativeHandle(ref, () => ({
      addSavedToList,
    }));

    return (
      <div className="border p-2 rounded ">
        test
        {/* {savedList.map((item, index) => (
        // Your rendering logic here, use index as key for now
      ))} */}
      </div>
    );
  }
);

export default SavedItems;
