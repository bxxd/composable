import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";
import { JSONContent } from "@tiptap/react";
import { saveToLocalStorage, readFromLocalStorage } from "./utils";
import { defaultAiModel } from "./models";

type GlobalContextType = {
  aiModel: string;
  setAiModel: React.Dispatch<React.SetStateAction<string>>;
  savedList: JSONContent[];
  setSavedList: React.Dispatch<React.SetStateAction<JSONContent[]>>;
};

export const GlobalContext = createContext<GlobalContextType>({
  aiModel: "",
  setAiModel: () => {},
  savedList: [],
  setSavedList: () => {},
});

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [aiModel, setAiModel] = useState(
    readFromLocalStorage("aiModel", defaultAiModel)
  );
  const [savedList, _setSavedList] = useState<JSONContent[]>([]);

  const setSavedList: React.Dispatch<React.SetStateAction<JSONContent[]>> = (
    value
  ) => {
    console.log("saving to local storage");
    const newList = typeof value === "function" ? value(savedList) : value;
    _setSavedList(newList);
    saveToLocalStorage("savedList", newList);
  };

  useEffect(() => {
    console.log("saving aiModel to local storage");
    saveToLocalStorage("aiModel", aiModel);
  }, [aiModel]);

  return (
    <GlobalContext.Provider
      value={{ aiModel, setAiModel, savedList, setSavedList }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    // Optional: Throw an error if context is not inside a provider
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context; // Returns the context values
};

export function useLatestContextValue<T extends keyof GlobalContextType>(
  key: T
) {
  const context = useContext(GlobalContext);
  const latestValueRef = useRef(context[key]);

  useEffect(() => {
    latestValueRef.current = context[key];
  }, [context, key]);

  return latestValueRef;
}
