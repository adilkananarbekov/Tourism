import { Helmet } from 'react-helmet-async';
import { withBasePath } from '../lib/assets';

const DEFAULT_TITLE = 'Kyrgyz Travel | Tours in Kyrgyzstan';
const DEFAULT_DESCRIPTION =
  'Plan Kyrgyzstan tours with curated itineraries, cultural experiences, and mountain adventures.';
const DEFAULT_IMAGE = '/images/hero.jpg';

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
};

export function SEO({ title, description, image, url }: SEOProps) {
  const metaTitle = title ? `${title} | Kyrgyz Travel` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = withBasePath(image || DEFAULT_IMAGE);

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
