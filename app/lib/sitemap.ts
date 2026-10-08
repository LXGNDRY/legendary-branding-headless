export function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

/**
 * One sitemap entry. Only <loc> and (when given) <lastmod>: Google ignores
 * <priority> and <changefreq>, and it only trusts <lastmod> when it is
 * consistently accurate, so callers pass it only for reliable dates.
 */
export function urlEntry(origin: string, path: string, lastmod?: string) {
  return `  <url>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}\n  </url>`;
}
