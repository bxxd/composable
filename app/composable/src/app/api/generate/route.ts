// ./app/api/chat/route.ts
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  console.log("generate AI response..");
  // Extract the `prompt` from the body of the request

  const { prompt } = await req.json();
  // console.log("Request body:", prompt);

  let payload = JSON.parse(prompt);
  let messages = payload.messages;
  let aiModel = payload.aiModel;

  let system_prompt = {
    role: "system",
    content: "logos, analytical rigor, calculations.",
  };

  if (messages.length > 0 && messages[0].role != "system") {
    messages = [system_prompt, ...messages];
  }

  let openai = new OpenAI({
    // apiKey: process.env.OPENAI_API_KEY || "",
    apiKey: process.env.OPENROUTER_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
  });

  if (aiModel.includes("openai")) {
    console.log("using openai");
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
      // baseURL: "https://api.openai.com",
    });
    aiModel = aiModel.replace("openai/", "");
  }

  // console.log("messages", messages);
  try {
    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create(
      {
        model: aiModel,
        stream: true,
        messages: messages,
        max_tokens: 1024,
      },
      {
        headers: {
          "HTTP-Referer": "https://composable.parts",
          "X-Title": "Composable Parts",
        },
      }
    );

    // headers={ "HTTP-Referer": "https://openrouter.ai",
    // "X-Title": "composable" }

    // console.log("response", response);

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // console.log("returning stream", stream);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.log("error", error);
    try {
      return NextResponse.json((error as any).error.message, { status: 500 });
    } catch (error) {
      return NextResponse.json(error, { status: 500 });
    }
  }
}
