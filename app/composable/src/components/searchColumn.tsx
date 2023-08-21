import React, { useState } from "react";
import { Icon } from "@iconify/react";
import baselineAddCircle from "@iconify/icons-ic/baseline-add-circle";

interface Item {
  id: number;
  name: string;
}

interface SearchColumnProps {
  data: Item[];
  handleAddContent: (content: string) => void;
}

const SearchColumn: React.FC<SearchColumnProps> = ({
  data,
  handleAddContent,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const filteredData: Item[] = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="flex flex-col ml-4 m-1">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-2 p-2 border rounded"
        >
          Expand Search
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col m-1">
      <button
        onClick={() => setCollapsed(true)}
        className="mb-2 p-2 border rounded"
      >
        Collapse Search
      </button>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-2 p-2 border rounded"
      />
      <div className="border p-2 rounded bg-gray-100">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="p-1 flex items-center relative group hover:bg-gray-200"
          >
            <span
              className="mr-2 opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={() => handleAddContent(item.name)}
            >
              <Icon icon={baselineAddCircle} width={24} height={24} />
            </span>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchColumn;
