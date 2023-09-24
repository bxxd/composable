"use client";

import Layout from "@/components/Layout"; // Importing Layout component
import Published from "@/components/publish/published";

export default function Page({ params }: { params: { slug: string } }) {
  console.log(`params: ${params}`);
  let slug = params.slug;

  return (
    <>
      <Layout>
        <div className="flex flex-col items-start border-r border-b border-solid rounded-lg m-1 mb-5 pl-2 pr-2 border-gray-100 dark:border-gray-600">
          <Published id={slug} />
        </div>
      </Layout>
    </>
  );
}
