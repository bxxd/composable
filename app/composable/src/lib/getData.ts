import getURL from "@/lib/getURL";

export default async function getData(slug: string) {
  let url = getURL(`/api/blob?id=${slug}`);
  console.log(`url: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`Failed to fetch data for slug: ${slug}`);
    throw new Error("Failed to fetch data");
  }
  const ret = await res.json();
  return ret[0];
}
