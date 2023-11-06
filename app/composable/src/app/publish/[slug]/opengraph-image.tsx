import React from "react";
import OGImage from "@/components/og-image";

// Route segment config
export const runtime = "edge";

export default function Image({ params }: { params: { slug: string } }) {
  return OGImage({ params: { slug: "publish/" + params.slug } });
}
