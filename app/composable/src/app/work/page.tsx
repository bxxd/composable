"use client";

import Layout from "@/components/Layout";
import Workspace from "@/components/workspace";
import { AiModelSelector } from "@/components/header/AiModelSelector";

export default function Page() {
  return (
    <Layout
      headerChildrenComponents={[<AiModelSelector key="model-selector" />]}
    >
      <Workspace />
    </Layout>
  );
}
