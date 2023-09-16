"use client";

import Layout from "@/components/Layout"; // Importing Layout component
import Published from "@/components/publish/published";

export default function Page({ params }: { params: { slug: string } }) {
  console.log(`params: ${params}`);
  let slug = params.slug;

  return (
    <Layout>
      <Published id={slug} />
    </Layout>
  );
}
