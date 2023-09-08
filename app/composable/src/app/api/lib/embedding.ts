import OpenAI from "openai";
import { retry } from "ts-retry-promise";

export const runtime = "edge";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function getEmbedding(
  text: string | null,
  engine = "text-embedding-ada-002"
): Promise<number[] | null> {
  if (!text) {
    console.log("getEmbedding: text is empty");
    return null;
  }
  console.log(`getEmbedding: ${text}`);
  text = text.replace("\n", " ");

  try {
    const response = await retry(
      () =>
        openai.embeddings.create({
          input: text as string,
          model: engine,
        }),
      {
        retries: 5,
        timeout: 1000, // initial delay in ms
        backoff: "EXPONENTIAL",
      }
    );

    return response.data[0].embedding as number[];
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error to allow the retry decorator to catch it and retry if necessary
  }
}
