```json
{
  "name": "information_extraction",
  "description": "Extract the desired information from the following passage. Only extract the properties mentioned in the information_extraction' function.",
  "parameters": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "description": "What is the main intent of this excerpt?"
      },
      "subcategory": {
        "type": "string",
        "description": "What is the main thing this excerpt is about?"
      },
      "insight": {
        "type": "string",
        "description": "What is the main thing people should know about this excerpt, if you could tell them one thing?"
      },
      "analysis": {
        "type": "string",
        "description": "What would be the financial sentiment of this passage, from the perspective of an investor?",
        "enum": [
          "very positive",
          "positive",
          "mixed",
          "neutral",
          "negative",
          "very negative"
        ]
      },
      "title": {
        "type": "string",
        "description": "Give a well formatted title for this passage, so people know what they are looking at. Be concise."
      }
    },
    "required": [
      "category",
      "subcategory",
      "tags",
      "insight",
      "analysis",
      "title"
    ]
  }
}
```
