"use client";

import Layout from "@/components/Layout"; // Importing Layout component
import { useCallback, useEffect, useState } from "react";
import Published from "@/components/publish/published";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import closeIcon from "@iconify/icons-ic/baseline-close";
import { Icon } from "@iconify/react";
import searchIcon from "@iconify/icons-ic/search";
import React from "react";
import { Menu, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface MemoizedCardProps {
  id: string;
}

const MemoizedCard: React.FC<MemoizedCardProps> = React.memo(
  ({ id }) => {
    return (
      <div className="card rounded-lg shadow-lg cursor-pointer border">
        <div className="pointer-events-none">
          <Published id={id} />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id;
  }
);

MemoizedCard.displayName = "MemoizedCard";

const Page: React.FC = () => {
  const [items, setItems] = useState<any[]>([]); // State to hold fetched items
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false); // New state

  const [sortType, setSortType] = useState<string>("created"); // New state variable
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For dropdown menu

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectSortType = (type: string) => {
    setSortType(type);
    fetchItems(searchQuery, type); // Fetch items with new sort type
    handleClose();
  };

  const fetchItems = useCallback(
    async (
      searchTerm: string | null = null,
      sortType: string | null = null
    ) => {
      try {
        let url = "/api/blob?limit=64";
        if (searchTerm) {
          url += `&search_term=${searchTerm}`;
        }
        if (sortType) {
          url += `&sort=${sortType}`; // Adding sorting parameter
        }
        console.log("fetching items from url: ", url);
        const res = await fetch(url); // Replace with your API endpoint
        // console.log("res", res);
        const data = await res.json();
        console.log("data", JSON.stringify(data));
        setItems(data); // Set fetched data to state
        if (searchTerm) {
          setIsSearchActive(true);
        } else {
          setIsSearchActive(false);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    },
    [setItems, setIsSearchActive]
  );

  useEffect(() => {
    // Function to fetch the last 10 created items

    fetchItems(); // Call the fetch function
  }, [fetchItems]);

  const clearSearch = () => {
    setSearchQuery("");
    fetchItems();
  };

  const handleSearch = () => {
    console.log("handleSearch searchQuery", searchQuery);
    if (searchQuery.length >= 3) {
      fetchItems(searchQuery);
    } else if (searchQuery.length === 0 && isSearchActive === true) {
      fetchItems();
    } else {
      toast.error("Search query must be at least 3 characters long.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDelete = async (id: number) => {
    console.log("handleDelete id", id);
    try {
      const response = await fetch(`/api/blob?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh data or filter out the deleted item
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        const errorData = await response.json();
        console.error("Error deleting item:", errorData.message);
      }
    } catch (error) {
      console.error("Error calling delete endpoint:", error);
    }
  };

  const router = useRouter(); // Initialize the router
  return (
    <Layout>
      <div className="flex pl-3 pt-2">
        <div className="relative">
          {" "}
          <input
            type="text"
            placeholder="Semantic Search..."
            value={searchQuery}
            onKeyDown={handleKeyDown}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-6 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:border-red-200"
          />
          <button
            className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer"
            onMouseDown={handleSearch}
          >
            {/* Place your search icon here */}
            <Icon icon={searchIcon} width={16} height={16} />
          </button>
          {searchQuery && (
            <div
              onClick={() => clearSearch()}
              className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            >
              {/* Place your close icon here */}
              <Icon icon={closeIcon} width={16} height={16} />
            </div>
          )}
        </div>
        <div className="flex pl-2 opacity-40 text-sm">
          <button onClick={handleClick} className="mr-2">
            Sort By <ArrowDropDownIcon />
          </button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => selectSortType("likes")}>Likes</MenuItem>
            <MenuItem onClick={() => selectSortType("created")}>
              Newest
            </MenuItem>
          </Menu>
        </div>
      </div>
      <div>
        <div className="flex flex-col mr-4 ml-2 mb-2 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
              <div className="relative" key={item.id}>
                {" "}
                {/* <-- Set position: relative to this container */}
                {item.is_mine && (
                  <button
                    className="opacity-50 absolute bottom-0 right-0 p-2 cursor-pointer z-10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Icon
                      icon="icon-park-twotone:delete"
                      color="#c25d55"
                      width="20"
                      height="20"
                    />
                  </button>
                )}
                <Link href={`/published/${item.id}`}>
                  <div className="card rounded-lg border cursor-pointer">
                    <div className="pointer-events-none">
                      <MemoizedCard id={item.id} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          position: relative;
          overflow: hidden;
          min-height: 20rem;
          max-height: 20rem;
          box-sizing: border-box;
        }

        .card::after {
          content: "";
          position: absolute;
          bottom: 0;
          height: 50%;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, #eeeeee);
        }
      `}</style>
    </Layout>
  );
};

Page.displayName = "Page";

export default Page;
