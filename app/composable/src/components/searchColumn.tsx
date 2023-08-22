import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import baselineAddCircle from "@iconify/icons-ic/baseline-add-circle";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineChevronRight from "@iconify/icons-ic/baseline-chevron-right"; // Right arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon
import { DataItem } from "@/lib/types";

interface SearchColumnProps {
  handleAddData: (content: DataItem) => void;
}

const SearchColumn: React.FC<SearchColumnProps> = ({ handleAddData }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [expandedExcerpt, setExpandedExcerpt] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/excerpts");
        const items: DataItem[] = await response.json();
        setData(items);
      } catch (err) {
        console.error("An error occurred:", err);
      }
    };
    fetchData();
  }, []);

  const filteredData: DataItem[] = data.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="flex flex-col ml-4 m-1 w-full">
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
      <div className="border p-2 rounded bg-gray-100 ">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="p-1 flex flex-col relative group hover:bg-gray-200 border-gray-300 border border-dashed rounded-lg m-1"
          >
            <div className="flex items-center">
              <span
                className="mr-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                onClick={() => handleAddData(item)}
              >
                <Icon icon={baselineAddCircle} width={24} height={24} />
              </span>
              <div
                className="flex-grow flex items-center cursor-pointer"
                onClick={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
              >
                <span className="flex-grow">{item.title}</span>
                <span className="ml-2">
                  <Icon
                    icon={
                      expandedItem === item.id
                        ? baselineExpandLess
                        : baselineExpandMore
                    }
                    width={24}
                    height={24}
                  />
                </span>
              </div>
            </div>
            {expandedItem === item.id && (
              <div className="ml-4 mt-2 border-t border-gray-300">
                <div>
                  <strong>Category:</strong> {item.category}
                </div>
                <div>
                  <strong>Subcategory:</strong> {item.subcategory}
                </div>
                <div>
                  <strong>Insight:</strong> {item.insight}
                </div>
                <div>
                  <strong>Length:</strong> {item.tokens}
                </div>
                <div>
                  <strong>Raw:</strong>
                  <span
                    className="ml-2 cursor-pointer"
                    onClick={() =>
                      setExpandedExcerpt(
                        expandedExcerpt === item.id ? null : item.id
                      )
                    }
                  >
                    <Icon
                      icon={
                        expandedExcerpt === item.id
                          ? baselineChevronLeft
                          : baselineChevronRight
                      }
                      width={24}
                      height={24}
                    />
                  </span>
                  {expandedExcerpt === item.id
                    ? item.excerpt
                    : item.excerpt.substring(0, 25) + "..."}{" "}
                  {/* Adjust the length as needed */}
                </div>
                <div>
                  <strong>Tags:</strong> {item.tags.join(", ")}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchColumn;
