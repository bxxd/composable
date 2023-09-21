import React, { useEffect, useCallback } from "react";

import { aiModels } from "@/lib/models";
import { useGlobalContext } from "@/lib/context";

type AiModelSelectorProps = {};

export const AiModelSelector = React.memo((): React.ReactElement => {
  const { aiModel: selectedModel, setAiModel: setSelectedModel } =
    useGlobalContext();

  useEffect(() => {
    console.log("Current selected model:", selectedModel);
  }, [selectedModel]);

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      console.log("onChange triggered");
      setSelectedModel(e.target.value);
    },
    []
  );

  return (
    <select
      className="flex mr-1"
      value={selectedModel}
      onChange={handleOnChange}
    >
      {aiModels.map((model, index) => (
        <option key={index} value={model.value}>
          {model.name}
        </option>
      ))}
    </select>
  );
});

export default AiModelSelector;
