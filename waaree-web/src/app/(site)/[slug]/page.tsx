import { PublicPage } from "@/features/pages";

// Pages published from the CMS (live version only). Fetched in the browser from the API.
export const instant = false;

export default async function CmsPublishedPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  return <PublicPage slug={slug} />;
}
