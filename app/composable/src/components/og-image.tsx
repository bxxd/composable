import { ImageResponse } from "next/og";
import React from "react";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "About Acme";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  // Font
  const interSemiBold = fetch(
    new URL("./Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  console.log(`server side published: ${params.slug}`);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 28,
          background: "white",
          backgroundImage: `url('http://api.kittie.ai/api/social-image/${params.slug}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column", // Use column layout to push content to the bottom
          justifyContent: "flex-end", // Align content to the bottom
          alignItems: "flex-start", // Align content to the left
          padding: "10px", // Add some padding
        }}
      >
        <div
          style={{
            // This is the gradient overlay with a transparent-to-black gradient
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 30%, rgba(3, 29, 66, 0.6) 100%)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1, // Positioned above the background image but below the text
          }}
        />
        <span
          style={{
            color: "#ccc", // Make the text color white for visibility
            textShadow: "0px 0px 4px rgba(3, 29, 66, 1)", // Add shadow to the text for better readability
            paddingLeft: "10px",
          }}
        >
          composable.parts/{params.slug}
        </span>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await interSemiBold,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
