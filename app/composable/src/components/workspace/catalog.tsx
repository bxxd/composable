import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { BlockStore } from "@/lib/editor";

type KeyButtonProps = {
  keyName: string;
  onDelete: (key: string) => void;
  isActive: boolean;
  onClick: (key: string) => void;
};

const KeyButton: React.FC<KeyButtonProps> = ({
  keyName,
  onDelete,
  isActive,
  onClick,
}) => {
  const buttonClasses = isActive
    ? "bg-blue-200 dark:bg-blue-700 dark:hover:bg-blue-600 cursor-default shadow-inner"
    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer shadow-sm";

  return (
    <div className={`flex items-center rounded-md p-1 ${buttonClasses} `}>
      <div
        onClick={() => {
          if (!isActive) onClick(keyName);
        }}
        className="flex"
      >
        <span className="text-sm text-gray-600 dark:text-gray-300 mx-2">
          {" "}
          {/* Changed text-sm to text-xs */}
          {keyName.length > 0 ? <>{keyName}</> : <>Home</>}
        </span>
      </div>
      {true && (
        <Icon
          icon="ic:baseline-close"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          onClick={() => onDelete(keyName)}
          width={16}
          height={16}
        />
      )}
    </div>
  );
};

type CatalogProps = {
  onToggleCatalog: () => void;
};

const Catalog: React.FC<CatalogProps> = ({ onToggleCatalog }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  useEffect(() => {
    refreshKeys();
    const handleStorageChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key?.startsWith("blockStore")) {
        refreshKeys(); // Re-fetch keys
      } else if (e.type === "local-storage-updated") {
        refreshKeys();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-updated", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-updated", handleStorageChange);
    };
  }, []);

  const refreshKeys = () => {
    const blockStoreKeys: string[] = [];
    let emptyKeyExists = false; // Track whether "" exists as a key

    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i) as string;
      if (key.startsWith("blockStore")) {
        key = key.replace("blockStore", "").replace("#", "");

        if (key === "") {
          emptyKeyExists = true; // Set flag if "" is found
        }

        blockStoreKeys.push(key);
      }
    }

    // Sort keys alphabetically
    blockStoreKeys.sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });

    // Add "" at the beginning if it doesn't exist
    if (!emptyKeyExists) {
      blockStoreKeys.unshift("");
    }

    setKeys(blockStoreKeys);
  };

  // Listen to changes in localStorage

  const onDelete = (key: string) => {
    const deleteSuccess = BlockStore.getInst(key).delete(key);
    if (deleteSuccess && slug === key) {
      router.push(`/work`);
    }
  };

  const newKeyInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingNewKey, setIsCreatingNewKey] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");

  const handleCreateCategory = () => {
    if (newKeyName.length > 0) {
      setIsCreatingNewKey(false);
      // Logic to save newKeyName into your storage here
      router.push(`/work/${newKeyName}`);
    } else {
      setIsCreatingNewKey(false);
    }
  };

  const handleNewKeyCreation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCreateCategory();
    }

    if (e.key === "Escape") {
      setIsCreatingNewKey(false);
    }

    if (e.key === "Backspace" && newKeyName.length === 0) {
      setIsCreatingNewKey(false);
    }
  };

  const handleInputBlur = () => {
    if (newKeyName === "") {
      setIsCreatingNewKey(false);
    }
  };

  const router = useRouter();

  return (
    <>
      <div className="flex flex-wrap pt-1">
        <div className="flex items-center h-[32px] ml-2 mr-1 pt-1">
          <Icon
            icon="ph:x-thin"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            onClick={() => onToggleCatalog()}
            width={18}
            height={18}
          />
        </div>
        {keys.map((key, index) => (
          <div className="m-1" key={index}>
            <KeyButton
              keyName={key}
              onDelete={onDelete}
              isActive={key === slug}
              onClick={(key) => {
                router.push(`/work/${key}`);
              }}
            />
          </div>
        ))}
        {isCreatingNewKey ? (
          <div className="relative">
            <input
              type="text"
              ref={newKeyInputRef}
              className="m-1 mt-[5px] px-2  h-[27px] py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:border-blue-200 pr-6"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={handleNewKeyCreation}
              onBlur={handleInputBlur}
              placeholder="New Project Name"
              autoFocus
            />
            <Icon
              icon="tdesign:plus"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              width={20}
              height={20}
              onClick={handleCreateCategory}
            />
          </div>
        ) : (
          <div
            className="flex items-center h-[27px] ml-1 mr-1 mt-[5px] shadow-sm rounded-md "
            onClick={() => {
              setIsCreatingNewKey(true);
              setNewKeyName("");
            }}
          >
            <Icon
              icon="tdesign:plus"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              width={23}
              height={23}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Catalog;
