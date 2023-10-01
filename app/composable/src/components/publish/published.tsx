import "@/styles/publish.scss";

import React from "react";
import { BlockStore } from "@/lib/editor";

import { useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "./extensions";
import { Icon } from "@iconify/react";

import { useRouter } from "next/navigation";

import { useEffect, useRef, useState } from "react";
import { JSONContent } from "@tiptap/react";

import { toast } from "sonner";

type PublishedProps = { id: string };

const Published: React.FC<PublishedProps> = ({ id }) => {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<any>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        console.log("URL copied to clipboard");
        toast("URL copied to clipboard");
      },
      (err) => {
        console.error("Could not copy URL: ", err);
        toast(`Could not copy URL: ${err}`);
      }
    );
  };

  const editor = useEditor({
    extensions: publishedExtensions,
    editable: false,
  });

  const fetchContentData = async (id: string) => {
    console.log("fetching content data for id: ", id);
    try {
      const res = await fetch(`/api/blob?id=${id}`);
      const data = await res.json();
      // console.log("data", data);
      setData(data[0]);
      return data[0];
    } catch (error) {
      toast(`Error fetching content data: ${error}`);
      return [];
    }
  };

  useEffect(() => {
    if (editor) {
      const fetchData = async () => {
        const data = await fetchContentData(id);

        if (!data) {
          toast.error("Failed to fetch content data");
          setHydrated(true);
          return;
        }

        const contentArray = data.data;
        setTimeout(() => {
          editor.commands.setContent(contentArray);
        }, 0);
        console.log("done hydrating");
      };
      fetchData();
      setHydrated(true);
    }
  }, [editor, id, setHydrated]);

  const router = useRouter();

  const [likes, setLikes] = useState<number>(0); // Replace 0 with the initial number of likes from the server if available
  const [isLiked, setIsLiked] = useState<boolean>(false);

  useEffect(() => {
    // Set initial likes from the server
    setLikes(data?.likes || 0);

    // Check if the post is liked by this user
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setIsLiked(likedPosts.includes(data?.id));
  }, [data?.id, data?.likes]);

  useEffect(() => {
    // Check if the post is liked by this user
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setIsLiked(likedPosts.includes(data?.id));
  }, [data?.id]);

  const handleLike = async () => {
    let likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");

    // Optimistically update UI
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    if (isLiked) {
      // Remove the id from the array
      likedPosts = likedPosts.filter((id: string) => id !== data?.id);
    } else {
      // Add the id to the array
      likedPosts.push(data?.id);
    }

    try {
      const res = await fetch("/api/blob/updateLikes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blobId: data?.id,
          likeStatus: !isLiked, // true for like, false for unlike
        }),
      });

      const result = await res.json();

      if (result.success) {
        // Update local storage since operation was successful
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
      } else {
        // Rollback optimistic update
        setIsLiked(isLiked);
        setLikes(likes);

        console.log(
          "An error occurred while updating likes: ",
          JSON.stringify(result)
        );
        toast.error("Failed to update likes on the server");
      }
    } catch (error) {
      // Rollback optimistic update
      setIsLiked(isLiked);
      setLikes(likes);

      console.error("An error occurred while updating likes: ", error);
      toast.error("Failed to update likes on the server");
    }
  };

  // if (!hydrated) {
  //   return <div>Loading...</div>;
  // }

  if (!data) {
    return <div className="opacity-50">Loading...</div>;
  }

  return (
    <>
      {/* TipTap Component */}
      <div
        className="flex flex-col w-full"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b p-2 pr-4 mb-2 shadow-sm">
          <div className="flex mr-2 width-full">
            <button onMouseDown={copyToClipboard}>
              <Icon icon="ph:link-thin" width={21} height={21} color="#aaa" />
            </button>
            {data?.original && (
              <button
                onClick={() => router.push(`/work/${id}`)}
                className="ml-2"
              >
                <Icon
                  icon="iconamoon:edit-thin"
                  width={21}
                  height={21}
                  color="#aaa"
                />
              </button>
            )}
            <button onClick={handleLike} className="ml-2">
              <Icon
                icon={isLiked ? "ph:heart-duotone" : "ph:heart"}
                width={21}
                height={21}
                color={isLiked ? "rgba(255, 0, 0, 0.5)" : "#aaa"} // 50% transparent red
              />
            </button>

            <span className="ml-1 opacity-40 text-xs mt-[3px]">{likes}</span>
          </div>
          <button
            type="button"
            onMouseDown={() => router.push("/play/" + id)}
            className="mr-1 ml-auto"
            title="Play as if it was a script."
          >
            <Icon icon="ph:play-light" width={21} height={21} color="#aaa" />
          </button>
          <div className="text-sm opacity-25 italic">
            <div>
              {data?.id} Created by {data?.ai_model}
            </div>
          </div>
        </div>
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert rounded-lg p-2 leading-relaxed outline-none "
        />
      </div>
    </>
  );
};

Published.displayName = "Published";

export default Published;
