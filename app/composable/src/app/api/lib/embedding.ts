import OpenAI from "openai";
import { retry } from "ts-retry-promise";

export const runtime = "edge";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number = 5,
  timeout: number = 5000
): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Retry ${i + 1} failed: ${(error as Error).message}`);
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }
  throw lastError;
}

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
    const response = await retryAsync(
      () =>
        openai.embeddings.create({
          input: text as string,
          model: engine,
        }),
      5, // Number of retries
      2000 // Timeout in ms
    );

    return response.data[0].embedding as number[];
  } catch (error) {
    console.error(error);
    throw error;
  }
}
