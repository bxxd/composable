"use client";

import Layout from "@/components/Layout"; // Importing Layout component
import { useEffect, useState } from "react";
import Published from "@/components/publish/published";
import { useRouter } from "next/navigation";

export default function Page() {
  const [items, setItems] = useState<any[]>([]); // State to hold fetched items

  useEffect(() => {
    // Function to fetch the last 10 created items
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/blob?limit=44"); // Replace with your API endpoint
        const data = await res.json();
        setItems(data); // Set fetched data to state
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems(); // Call the fetch function
  }, []);

  const router = useRouter(); // Initialize the router
  return (
    <Layout>
      <div className="App flex flex-col gap-4 mr-4 ml-2 mb-2 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="card rounded-lg shadow-lg cursor-pointer border bg-white dark:bg-black"
              onClick={() => router.push(`/ai-created/${item.id}`)}
            >
              <div className="pointer-events-none">
                <Published id={item.id} />
              </div>
            </div>
          ))}
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
          background: linear-gradient(transparent, #cccccc);
        }
      `}</style>
    </Layout>
  );
}
