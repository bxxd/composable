"use client";

import Layout from "@/components/Layout";
import Play from "@/components/script/Play";
import { AiModelSelector } from "@/components/header/AiModelSelector";

export default function Page() {
  return (
    <Layout
      headerChildrenComponents={[<AiModelSelector key="model-selector" />]}
    >
      <Play />
    </Layout>
  );
}
