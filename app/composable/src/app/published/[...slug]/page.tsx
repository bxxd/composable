import React from "react";

import Layout from "@/components/layout.server";
import Published from "@/components/publish/published.server";

export default async function Page({ params }: { params: { slug: string } }) {
  let slug = params.slug;
  console.log(`server side published: ${slug}`);

  return (
    <>
      <Layout>
        <div>
          <Published id={slug} />
        </div>
      </Layout>
    </>
  );
}
