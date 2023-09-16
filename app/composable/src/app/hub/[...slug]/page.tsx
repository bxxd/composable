"use client";

import Layout from "@/components/Layout"; // Importing Layout component

interface PageProps {
  params: {
    slug: string;
  };
}

export default function Page({ params }: PageProps) {
  console.log(`params: ${params}`);
  let slug = params.slug;

  return (
    <Layout>
      <div className="App flex flex-col gap-4">{slug}</div>
    </Layout>
  );
}
