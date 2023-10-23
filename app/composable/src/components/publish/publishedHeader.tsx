"use client";
import React from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PublishedHeaderProps = {
  data: any;
  id: string;
};

const PublishedHeader: React.FC<PublishedHeaderProps> = ({ data, id }) => {
  const router = useRouter();

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

  const [likes, setLikes] = React.useState<number>(data?.likes || 0);
  const [isLiked, setIsLiked] = React.useState<boolean>(false);

  React.useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
    setIsLiked(likedPosts.includes(data?.id));
  }, [data?.id]);

  const handleLike = async () => {
    let likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");

    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    if (isLiked) {
      likedPosts = likedPosts.filter((postId: string) => postId !== data?.id);
    } else {
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
          likeStatus: !isLiked,
        }),
      });

      const result = await res.json();
      if (result.success) {
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
      } else {
        setIsLiked(isLiked);
        setLikes(likes);
        toast.error("Failed to update likes on the server");
      }
    } catch (error) {
      setIsLiked(isLiked);
      setLikes(likes);
      toast.error("Failed to update likes on the server");
    }
  };

  return (
    <div className="flex justify-between items-center border-b p-2 pr-4 shadow-sm">
      <div className="flex mr-2 width-full">
        <button onMouseDown={copyToClipboard}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 256 256"
          >
            <path
              fill="#aaa"
              d="M134.71 189.19a4 4 0 0 1 0 5.66l-9.94 9.94a52 52 0 0 1-73.56-73.56l24.12-24.12a52 52 0 0 1 71.32-2.1a4 4 0 1 1-5.32 6A44 44 0 0 0 81 112.77l-24.13 24.12a44 44 0 0 0 62.24 62.24l9.94-9.94a4 4 0 0 1 5.66 0Zm70.08-138a52.07 52.07 0 0 0-73.56 0l-9.94 9.94a4 4 0 1 0 5.71 5.68l9.94-9.94a44 44 0 0 1 62.24 62.24L175 143.23a44 44 0 0 1-60.33 1.77a4 4 0 1 0-5.32 6a52 52 0 0 0 71.32-2.1l24.12-24.12a52.07 52.07 0 0 0 0-73.57Z"
            />
          </svg>
        </button>
        {data?.original && (
          <button onClick={() => router.push(`/work/${id}`)} className="ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="#aaa"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 16l-1 4l4-1L19.586 7.414a2 2 0 0 0 0-2.828l-.172-.172a2 2 0 0 0-2.828 0L5 16ZM15 6l3 3m-5 11h8"
              />
            </svg>
          </button>
        )}
        <button onClick={handleLike} className="ml-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 256 256"
          >
            <g fill={isLiked ? "rgba(255, 0, 0, 0.5)" : "#aaa"}>
              <path
                d="M232 94c0 66-104 122-104 122S24 160 24 94a54 54 0 0 1 54-54c22.59 0 41.94 12.31 50 32c8.06-19.69 27.41-32 50-32a54 54 0 0 1 54 54Z"
                opacity=".2"
              />
              <path d="M178 32c-20.65 0-38.73 8.88-50 23.89C116.73 40.88 98.65 32 78 32a62.07 62.07 0 0 0-62 62c0 70 103.79 126.66 108.21 129a8 8 0 0 0 7.58 0C136.21 220.66 240 164 240 94a62.07 62.07 0 0 0-62-62Zm-50 174.8C109.74 196.16 32 147.69 32 94a46.06 46.06 0 0 1 46-46c19.45 0 35.78 10.36 42.6 27a8 8 0 0 0 14.8 0c6.82-16.67 23.15-27 42.6-27a46.06 46.06 0 0 1 46 46c0 53.61-77.76 102.15-96 112.8Z" />
            </g>
          </svg>
        </button>
        <span className="ml-1 opacity-40 text-xs mt-[3px]">{likes}</span>
      </div>
      <button
        type="button"
        onMouseDown={() => router.push("/play/" + id)}
        className="mr-1 ml-auto"
        title="Play as if it was a script."
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="21"
          height="21"
          viewBox="0 0 256 256"
        >
          <path
            fill="#aaa"
            d="M231.36 116.19L87.28 28.06a14 14 0 0 0-14.18-.27A13.69 13.69 0 0 0 66 39.87v176.26a13.69 13.69 0 0 0 7.1 12.08a14 14 0 0 0 14.18-.27l144.08-88.13a13.82 13.82 0 0 0 0-23.62Zm-6.26 13.38L81 217.7a2 2 0 0 1-2.06 0a1.78 1.78 0 0 1-1-1.61V39.87a1.78 1.78 0 0 1 1-1.61A2.06 2.06 0 0 1 80 38a2 2 0 0 1 1 .31l144.1 88.12a1.82 1.82 0 0 1 0 3.14Z"
          />
        </svg>
      </button>
      <div className="text-sm opacity-25 italic">
        <div>
          {data?.id} Created by {data?.ai_model}
        </div>
      </div>
    </div>
  );
};

export default PublishedHeader;
