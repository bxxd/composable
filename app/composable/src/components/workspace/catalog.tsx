import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";

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
    ? "bg-blue-200 dark:bg-blue-700 dark:hover:bg-blue-600 cursor-default"
    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer";

  return (
    <button
      className={`flex items-center rounded-md p-1 ${buttonClasses}`}
      onClick={() => {
        if (!isActive) onClick(keyName);
      }}
    >
      <span className="text-sm text-gray-600 dark:text-gray-300 mx-2">
        {" "}
        {/* Changed text-sm to text-xs */}
        Project {keyName}
      </span>
      {/* <Icon
          icon="ic:baseline-close"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          onClick={() => onDelete(keyName)}
          width={16}
          height={16}
        /> */}
    </button>
  );
};
type CatalogProps = {
  onToggleCatalog: () => void;
};

const Catalog = ({ onToggleCatalog }: CatalogProps) => {
  const [keys, setKeys] = useState<string[]>([]);
  const params = useParams();
  let slug = Array.isArray(params.slug) ? params.slug.join("") : params.slug;
  if (slug === undefined) {
    slug = "";
  }

  useEffect(() => {
    const blockStoreKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i) as string;
      if (key.startsWith("blockStore")) {
        key = key.replace("blockStore", "").replace("#", "");

        blockStoreKeys.push(key);
      }
    }
    blockStoreKeys.sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });

    setKeys(blockStoreKeys);
  }, []);

  const onDelete = (key: string) => {
    localStorage.removeItem(key);
    setKeys((prevKeys) => prevKeys.filter((k) => k !== key));
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
            width={18} // Adjust this for width
            height={18} // Adjust this for height
            style={{ fontWeight: 100 }} // Making it thin, you may have to check the specific icon's documentation for making it thin.
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
                /* your onClick logic here */
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default Catalog;
