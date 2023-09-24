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

export default function Page() {
  const [items, setItems] = useState<any[]>([]); // State to hold fetched items
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchItems = useCallback(
    async (searchTerm: string | null = null) => {
      try {
        let url = "/api/blob?limit=44";
        if (searchTerm) {
          url += `&search=${searchTerm}`;
        }
        const res = await fetch(url); // Replace with your API endpoint
        const data = await res.json();
        setItems(data); // Set fetched data to state
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    },
    [setItems] // Dependencies
  );

  useEffect(() => {
    // Function to fetch the last 10 created items

    fetchItems(); // Call the fetch function
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    fetchItems();
  };

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      // fetchItems(searchQuery);
    } else {
      if (searchQuery.length > 0) {
        toast.error("Search query must be at least 3 characters long.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const router = useRouter(); // Initialize the router
  return (
    <Layout>
      <div className="max-w-[300px] pl-3 pt-1">
        <div className="relative">
          {" "}
          <input
            type="text"
            placeholder="Semantic Search..."
            value={searchQuery}
            onKeyDown={handleKeyDown}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-6 py-2 border rounded focus:outline-none focus:ring-1 focus:border-red-200"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {/* Place your search icon here */}
            <Icon icon={searchIcon} width={16} height={16} />
          </div>
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
      </div>
      <div>
        <div className="flex flex-col mr-4 ml-2 mb-2 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
              <Link key={index} href={`/ai-created/${item.id}`}>
                <div className="card rounded-lg shadow-lg cursor-pointer border">
                  <div className="pointer-events-none">
                    <MemoizedCard id={item.id} />
                  </div>
                </div>
              </Link>
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
}
