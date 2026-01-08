import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = 'Tourism | Kyrgyz Riders';
const DEFAULT_DESCRIPTION =
  'Plan Kyrgyzstan tours with curated itineraries, cultural experiences, and mountain adventures.';
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
};

export function SEO({ title, description, image, url }: SEOProps) {
  const metaTitle = title ? `${title} | Kyrgyz Riders` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
}
