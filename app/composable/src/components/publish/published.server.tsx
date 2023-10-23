import "@/styles/publish.scss";

import React from "react";
import { generateHTML } from "@tiptap/html";
import { publishedExtensions } from "@/components/publish/extensions";
import getData from "@/lib/getData";
import PublishedHeader from "@/components/publish/publishedHeader";
import PublishedSEO from "@/components/publish/publishedSeo";
import {
  extractAllText,
  extractSummary,
  extractSummaryForTitle,
} from "@/lib/dataUtils"; // assuming you have these functions available

type PublishedProps = { id: string };

export default async function Published({ id }: PublishedProps) {
  const data = await getData(id);
  let html = generateHTML(data.data, publishedExtensions);
  let text = extractAllText(data.data);

  const maxTitleLength = 60; // Adjust based on your needs
  const maxDescriptionLength = 160; // Adjust based on your needs

  let prefix = "Prompt: ";
  let availableLength = maxTitleLength - prefix.length;
  const pageTitle = prefix + extractSummaryForTitle(text, availableLength);

  prefix = "Explore this published prompt from Composable Parts: ";
  availableLength = maxDescriptionLength - prefix.length;
  const pageDescription = prefix + extractSummary(text, availableLength);

  const pageImage = `https://composable.parts/api/social-image/published/${id}`;

  // className="prose dark:prose-invert p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 max-w-[90ch]"
  // <div className="pl-2 pt-2 bg-gray-200 dark:bg-gray-900 flex w-full">

  return (
    <>
      {/* <PublishedSEO
        title={pageTitle}
        description={pageDescription}
        image={pageImage}
      /> */}
      <PublishedHeader data={data} id={id} />

      <div className="flex pl-3 pt-2">
        <div
          className="prose dark:prose-invert rounded-lg p-2 leading-relaxed outline-none w-full break-words"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
}
