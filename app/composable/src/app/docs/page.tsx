"use client";

import Layout from "@/components/Layout"; // Importing Layout component
import Docs from "@/components/docs";

export default function Page() {
  return (
    <Layout>
      <div className="App flex flex-col gap-4">
        <Docs />
      </div>
    </Layout>
  );
}
