// ./app/api/chat/route.ts
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  console.log("hi there!");
  // Extract the `prompt` from the body of the request

  const { prompt } = await req.json();
  console.log("Request body:", prompt);

  let messages = JSON.parse(prompt);

  let system_prompt = {
    role: "system",
    content: "logos, analytical rigor, calculations.",
  };

  if (messages.length > 0 && messages[0].role != "system") {
    messages = [system_prompt, ...messages];
  }

  console.log("messages", messages);

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: messages,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // console.log("returning stream", stream);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
