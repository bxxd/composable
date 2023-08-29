import { createContext, useContext, useRef, useEffect } from "react";

type GlobalContextType = {
  aiModel: string;
  setAiModel: React.Dispatch<React.SetStateAction<string>>;
};

export const GlobalContext = createContext<GlobalContextType>({
  aiModel: "",
  setAiModel: () => {},
  // ... other default values and empty setter functions
});

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
  }, [context[key]]);

  return latestValueRef;
}
