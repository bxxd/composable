"use client";
import React from "react";
import { NextSeo } from "next-seo";

type PublishedSEOProps = {
  title: string;
  description: string;
  image: string;
};

const PublishedSEO: React.FC<PublishedSEOProps> = ({
  title,
  description,
  image,
}) => {
  console.log("title: ", title);
  console.log("description: ", description);
  return (
    <>
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          title: title,
          description: description,
          images: [
            {
              url: image,
              width: 1200,
              height: 600,
              alt: "Og Image Alt",
            },
          ],
        }}
        twitter={{
          handle: "@handle",
          site: "@site",
          cardType: "summary_large_image",
        }}
      />
    </>
  );
};
export default PublishedSEO;
