import { Helmet } from 'react-helmet-async';
import { withBasePath } from '../lib/assets';
import {
  DEFAULT_SOCIAL_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  type JsonLd,
} from '../lib/seo';

const DEFAULT_TITLE = `${SITE_NAME} | Kyrgyzstan Tours & Private Trips`;

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  language?: 'en' | 'ru';
  alternates?: Array<{ hrefLang: string; path: string }>;
};

export function SEO({
  title,
  description,
  image,
  path,
  url,
  type = 'website',
  noindex = false,
  jsonLd,
  language = 'en',
  alternates = [],
}: SEOProps) {
  const metaTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const metaDescription = description || SITE_DESCRIPTION;
  const metaImage = absoluteUrl(withBasePath(image || DEFAULT_SOCIAL_IMAGE));
  const canonicalUrl = url || absoluteUrl(path || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const jsonLdItems = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const ogLocale = language === 'ru' ? 'ru_RU' : 'en_US';

  return (
    <Helmet>
      <html lang={language} />
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      {alternates.map((alternate) => (
        <link
          key={`${alternate.hrefLang}-${alternate.path}`}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={absoluteUrl(alternate.path)}
        />
      ))}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="theme-color" content="#264c3e" />
      {jsonLdItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
