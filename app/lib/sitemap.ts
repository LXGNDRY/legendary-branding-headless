export function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const URLSET_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';
const MAX_IMAGES_PER_URL = 8;

export const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
} as const;

/**
 * One sitemap entry. <loc>, plus <lastmod> when given and <image:image> for
 * each image: Google ignores <priority> and <changefreq>, and it only trusts
 * <lastmod> when it is consistently accurate, so callers pass it only for
 * reliable dates.
 */
export function urlEntry(origin: string, path: string, lastmod?: string, images: readonly string[] = []) {
  const imageTags = images
    .slice(0, MAX_IMAGES_PER_URL)
    .map((url) => `\n    <image:image>\n      <image:loc>${escapeXml(url)}</image:loc>\n    </image:image>`)
    .join('');
  return `  <url>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}${imageTags}\n  </url>`;
}

/** A complete <urlset> document; the image namespace is only declared when an entry carries images. */
export function urlsetXml(entries: readonly string[]) {
  const namespaces = entries.some((entry) => entry.includes('<image:image>'))
    ? `xmlns="${URLSET_NS}" xmlns:image="${IMAGE_NS}"`
    : `xmlns="${URLSET_NS}"`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${namespaces}>\n${entries.join('\n')}\n</urlset>`;
}

/** A <sitemapindex> pointing at the per-type sitemaps. */
export function sitemapIndexXml(origin: string, paths: readonly string[]) {
  const items = paths.map((path) => `  <sitemap>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>\n  </sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${URLSET_NS}">\n${items}\n</sitemapindex>`;
}
