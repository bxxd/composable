// ./app/api/chat/route.ts
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse, NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const timeout = (ms: number, promise: Promise<any>) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export async function POST(req: NextRequest) {
  console.log("generate AI response..");

  let messages: any;
  let aiModel: any;
  let prompt: any;
  let payload: any;

  try {
    payload = await req.json();
    prompt = JSON.parse(payload["prompt"]);
    console.log("payload", payload);
    // console.log("payload", payload);
    messages = prompt.messages;
    aiModel = prompt.aiModel;
  } catch (error) {
    console.log("error", error, "payload:", payload);
    return NextResponse.json("Unable to parse the payload.", { status: 500 });
  }

  if (
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
    process.env.NODE_ENV != "development")
  ) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(25, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `novel_ratelimit_${ip}`
    );

    if (!success) {
      console.log("ratelimit", ip, limit, reset, remaining);
      return NextResponse.json(
        "You have reached your request limit for the day.",
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  }

  let system_prompt = {
    role: "system",
    content: "",
  };

  // if (messages.length > 0 && messages[0].role != "system") {
  //   messages = [system_prompt, ...messages];
  // }

  let openai = new OpenAI({
    // apiKey: process.env.OPENAI_API_KEY || "",
    apiKey: process.env.OPENROUTER_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
  });

  if (aiModel.includes("openai")) {
    console.log("using openai");
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    aiModel = aiModel.replace("openai/", "");
  }

  // console.log("messages", messages);
  try {
    // Ask OpenAI for a streaming chat completion given the prompt
    const apiCall = openai.chat.completions.create(
      {
        model: aiModel,
        stream: true,
        messages: messages,
        max_tokens: 2048,
      },
      {
        headers: {
          "HTTP-Referer": "https://composable.parts",
          "X-Title": "Composable Parts",
        },
      }
    );

    const response: any = await Promise.race([
      apiCall,
      timeout(10000, apiCall),
    ]);

    // console.log("response", response);

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    if (typeof error === "object" && error !== null && "message" in error) {
      if (error.message === "Request timed out") {
        // Handle the timeout specifically
        return NextResponse.json("Request timed out", { status: 504 }); // 504 Gateway Timeout
      } else {
        // Handle other errors
        return NextResponse.json((error as any).error.message, { status: 500 });
      }
    } else {
      // Handle unknown error types or other issues
      return NextResponse.json("An unknown error occurred", { status: 500 });
    }
  }
}
