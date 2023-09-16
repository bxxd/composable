"use client";

import Layout from "@/components/Layout"; // Importing Layout component

export default function Page({ params }: { params: { slug: string } }) {
  console.log(`params: ${params}`);
  let slug = params.slug;

  return (
    <Layout>
      <div className="App flex flex-col gap-4">{slug}</div>
    </Layout>
  );
}
