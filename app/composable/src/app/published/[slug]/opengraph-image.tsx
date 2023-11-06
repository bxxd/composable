import React from "react";
import OGImage from "@/components/og-image";

// Route segment config
export const runtime = "edge";

export default function Image({ params }: { params: { slug: string } }) {
  console.log("params.slug: ", params.slug);
  return OGImage({ params: { slug: "published/" + params.slug } });
}
