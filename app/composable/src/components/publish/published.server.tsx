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

  const pageImage = "URL_to_your_image";

  return (
    <>
      <PublishedSEO
        title={pageTitle}
        description={pageDescription}
        image={pageImage}
      />
      <header className="sticky  top-[42px] z-49 w-full transition-all duration-300 opacity-85 bg-white text-black dark:border-gray-700 dark:bg-black-900 dark:text-gray-300">
        <PublishedHeader data={data} id={id} />
      </header>
      <div className="pl-2 pt-2 bg-gray-200 dark:bg-gray-900 flex justify-center">
        <div
          className="prose dark:prose-invert p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-800 dark:text-gray-100 max-w-[90ch]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
}
