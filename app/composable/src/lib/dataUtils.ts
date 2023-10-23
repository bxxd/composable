export function extractAllText(data: any): string {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      // data is an array
      const texts: string[] = data.map((item) => extractAllText(item));
      return texts.join(" ");
    } else {
      // data is a dictionary
      const texts: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (key === "text") {
          texts.push(value as string);
        }
        if (typeof value === "object" && value !== null) {
          texts.push(extractAllText(value));
        }
      }
      return texts.join(" ");
    }
  } else {
    // data is neither a dictionary nor a list
    return "";
  }
}

export function extractSummary(text: string, maxLength: number) {
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
}

export function extractSummaryForTitle(text: string, maxLength: number) {
  const firstSentenceMatch = text.match(/(.*?[.!?])\s/);
  if (firstSentenceMatch && firstSentenceMatch[1].length <= maxLength) {
    return firstSentenceMatch[1];
  }

  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
}
