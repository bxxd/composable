import { aiModels } from "@/lib/models";
import { useGlobalContext } from "@/lib/context";
import React from "react";

type AiModelSelectorProps = {};

export const AiModelSelector: React.FC<AiModelSelectorProps> = () => {
  const { aiModel: selectedModel, setAiModel: setSelectedModel } =
    useGlobalContext();

  return (
    <select
      className="flex mr-1"
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
    >
      {aiModels.map((model, index) => (
        <option key={index} value={model.value}>
          {model.name}
        </option>
      ))}
    </select>
  );
};

export default AiModelSelector;
