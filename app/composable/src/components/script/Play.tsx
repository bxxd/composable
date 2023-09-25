import "@/styles/publish.scss";

import React from "react";
import { BlockStore, isTextContentEmpty } from "@/lib/editor";
import { useEditor, EditorContent } from "@tiptap/react";
import { publishedExtensions } from "../publish/extensions";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import CaptureUserInput from "./CaptureUserInput";
import DisplayMessage from "./DisplayMessage";
import { extractAllText } from "@/lib/editor";

type PlayProps = {};

const Play: React.FC<PlayProps> = ({}) => {
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [jsonData, setJsonData] = useState<JSONContent[]>([]);
  const [displayedBlocks, setDisplayedBlocks] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<JSONContent | null>(null);

  console.log(
    `rendering Play for slug='${slug}' with currentIndex ${currentIndex} and currentBlock ${extractAllText(
      currentBlock
    )}`
  );

  const blockState = BlockStore.getInst(slug);

  const handleNext = (userInput?: string) => {
    // Immediately save the current user input

    console.log("handleNext", jsonData);

    // Append the current block to displayedBlocks
    setDisplayedBlocks((prevBlocks) => [...prevBlocks, currentBlock]);

    // Now, increment the currentIndex to point to the next block

    if (currentIndex + 1 >= jsonData.length) {
      // toast.success("You've reached the end of the script");
      setCurrentBlock(null);
      return;
    }

    setCurrentBlock(jsonData[currentIndex + 1]);

    setCurrentIndex(currentIndex + 1);
  };

  useEffect(() => {
    blockState.loadFromLocalStorage();
    let jsonData: JSONContent[] = blockState.getCtxItemAtCurrentLevel();
    if (!jsonData) {
      toast.error("No content found");
    } else {
      setJsonData(jsonData); // Update the jsonData state
      // console.log("jsonData", JSON.stringify(jsonData));

      // handleNext();
      setCurrentBlock(jsonData[0]);

      console.log("hydrated..");
    }
    setHydrated(true);
  }, [blockState, setHydrated]);

  if (!hydrated) {
    return <div></div>;
  }

  function displayCurrentBlock() {
    if (!currentBlock) {
      return <div></div>;
    }

    console.log("displayCurrentBlock", extractAllText(currentBlock.content));
    return (
      <div key={currentIndex}>
        current:
        {currentBlock.attrs?.role === "user" ? (
          <div>
            <CaptureUserInput onSave={handleNext} />
          </div>
        ) : (
          <div>
            <DisplayMessage
              content={currentBlock.content}
              handleNext={handleNext}
            />
          </div>
        )}
      </div>
    );
  }

  console.log("displayedBlocks", displayedBlocks);

  return (
    <div>
      {/* {displayedBlocks.map((block, index) => (
        <React.Fragment key={index}>
          {index}
          {block.attrs.role === "user" ? (
            <div>
              <CaptureUserInput onSave={handleNext} />
            </div>
          ) : (
            <div>
              <DisplayMessage content={block.content} />
            </div>
          )}
        </React.Fragment>
      ))} */}
      {displayCurrentBlock()}
    </div>
  );
};

Play.displayName = "Play";
export default Play;
