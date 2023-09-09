import React, { useState, forwardRef, useEffect } from "react";
import { JSONContent } from "@tiptap/react";
import { Icon } from "@iconify/react";
import baselineAddCircle from "@iconify/icons-ic/baseline-add-circle";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineDelete from "@iconify/icons-ic/baseline-delete";
import { useGlobalContext } from "@/lib/context";
import { readFromLocalStorage } from "@/lib/utils";

interface SavedItemsProps {
  handleAddSaved: (content: JSONContent) => void;
}
const SavedItems = forwardRef<any, SavedItemsProps>(
  ({ handleAddSaved }, ref) => {
    const defaultSavedItem = {
      type: "dBlock",
      attrs: { role: "assistant", id: "0.1" },
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `*Connor here, focused and ready to take on the financial world with you.* Tell me, what's the main financial goal you want to hit this quarter? Are we expanding the project, looking to diversify investments, or something else? Time waits for no one, let's conquer the world together. Your next move?`,
            },
          ],
        },
      ],
    };

    const { savedList, setSavedList } = useGlobalContext();

    const [isExpanded, setIsExpanded] = useState(true);

    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
      if (!hydrated) {
        setTimeout(() => {
          setSavedList(readFromLocalStorage("savedList", []));
        }, 0);
        setHydrated(true);
      }
    }, [hydrated, setSavedList]);

    const [expandedItems, setExpandedItems] = useState<{
      [key: number]: boolean;
    }>({});

    const toggleExpand = (index: number) => {
      setExpandedItems({
        ...expandedItems,
        [index]: !expandedItems[index],
      });
    };

    const deleteItem = (index: number) => {
      const newList = [...savedList];
      newList.splice(index, 1);
      setSavedList(newList);
    };

    return (
      <div className="border p-2 rounded m-1 border-amber-200">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="opacity-50">Saved Items</span>

          <Icon
            icon={isExpanded ? baselineExpandLess : baselineExpandMore}
            width={24}
            height={24}
            style={{ opacity: savedList.length ? 1 : 0 }}
          />
        </div>

        {isExpanded &&
          savedList.map((item, index) => {
            const text =
              item?.content &&
              item.content[0]?.content &&
              item.content[0].content[0]?.text
                ? item.content[0].content[0].text
                : "Undefined";

            const shouldTruncate = text.length > 150;

            return (
              <div
                key={index}
                className="group flex items-center mt-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 border-amber-200 border border-dashed rounded-lg"
              >
                <button
                  type="button"
                  className="mr-1 opacity-10 group-hover:opacity-100 cursor-pointer"
                  onClick={() => handleAddSaved(item)}
                  title="Add data to context"
                >
                  <Icon icon={baselineAddCircle} width={24} height={24} />
                </button>

                <span
                  className="flex-grow"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:
                      expandedItems[index] || !shouldTruncate
                        ? "normal"
                        : "nowrap",
                    maxWidth: "90%",
                  }}
                >
                  {text}
                </span>
                {/* </div> */}

                {shouldTruncate && (
                  <button
                    type="button"
                    className="ml-1 opacity-10 group-hover:opacity-100"
                    onClick={() => toggleExpand(index)}
                  >
                    <Icon
                      icon={
                        expandedItems[index]
                          ? baselineExpandLess
                          : baselineExpandMore
                      }
                      width={24}
                      height={24}
                    />
                  </button>
                )}

                <button
                  type="button"
                  className="ml-1 opacity-10 group-hover:opacity-100"
                  onClick={() => deleteItem(index)}
                >
                  <Icon icon={baselineDelete} width={24} height={24} />
                </button>
              </div>
            );
          })}
      </div>
    );
  }
);

SavedItems.displayName = "SavedItems";
export default SavedItems;
