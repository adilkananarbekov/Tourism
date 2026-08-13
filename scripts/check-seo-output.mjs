import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(currentFilePath), '..');
const distDir = path.join(rootDir, 'dist');
const siteUrl = 'https://kyrgyz.tours';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function routeFile(routePath) {
  return routePath === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

function fail(message) {
  throw new Error(`SEO output check failed: ${message}`);
}

const tours = readJson('data/seed_tours.json');
const tourSlugs = readJson('data/tour_slugs.json');
const blogs = readJson('data/seed_blog_posts.json')
  .filter((post) => post.status !== 'draft' && post.status !== 'archived');
const destinations = readJson('data/destinations.json');
const sitemapPath = path.join(distDir, 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  fail('dist/sitemap.xml is missing');
}

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/kyrgyz\.tours[^<]*)<\/loc>/g)]
  .map((match) => match[1]);
const uniqueUrls = new Set(sitemapUrls);

if (sitemapUrls.length !== uniqueUrls.size) {
  fail('sitemap contains duplicate <loc> entries');
}

const entityRoutes = [
  ...tours.flatMap((tour) => {
    const slug = tourSlugs[String(tour.id)] || `tour-${tour.id}`;
    return [`/tours/${slug}`, `/ru/tours/${slug}`];
  }),
  ...blogs.map((post) => `/blogs/${post.slug || post.id}`),
  ...destinations.flatMap((destination) => [
    `/destinations/${destination.slug}`,
    `/ru/destinations/${destination.slug}`,
  ]),
];

for (const routePath of entityRoutes) {
  if (!uniqueUrls.has(`${siteUrl}${routePath}`)) {
    fail(`missing entity route in sitemap: ${routePath}`);
  }
}

for (const url of uniqueUrls) {
  const parsed = new URL(url);
  if (parsed.origin !== siteUrl || parsed.search || parsed.hash) {
    fail(`non-canonical sitemap URL: ${url}`);
  }
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    fail(`trailing slash in sitemap URL: ${url}`);
  }
  if (/^\/(?:ru\/)?tours\/\d+$/.test(parsed.pathname)) {
    fail(`numeric tour URL in sitemap: ${url}`);
  }

  const htmlPath = routeFile(parsed.pathname);
  if (!fs.existsSync(htmlPath)) {
    fail(`missing prerendered HTML for ${parsed.pathname}`);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"[^>]*>/i)?.[1];
  if (canonical !== url) {
    fail(`canonical mismatch for ${parsed.pathname}: ${canonical || 'missing'}`);
  }
  if (!html.includes('data-static-seo-content="true"')) {
    fail(`static SEO content missing for ${parsed.pathname}`);
  }
  if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) {
    fail(`title missing for ${parsed.pathname}`);
  }
  if (!/<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(html)) {
    fail(`meta description missing for ${parsed.pathname}`);
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) {
    fail(`expected exactly one H1 for ${parsed.pathname}, found ${h1Count}`);
  }
  if (/\/(?:ru\/)?tours\/\d+(?:[?"'#/]|$)/i.test(html)) {
    fail(`numeric tour link found in ${parsed.pathname}`);
  }
  if (/\?(?:[^"'#]*&amp;)?book=true/i.test(html)) {
    fail(`legacy ?book=true link found in ${parsed.pathname}`);
  }
}

console.log(
  `SEO output verified: ${uniqueUrls.size} canonical routes, ${tours.length} tours, ${blogs.length} blogs, ${destinations.length} destinations.`
);
