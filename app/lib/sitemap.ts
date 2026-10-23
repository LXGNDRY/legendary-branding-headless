import {localeAlternates} from './locale';

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

/**
 * One sitemap entry per locale for the given path, each carrying reciprocal
 * `xhtml:link rel="alternate" hreflang="..."` tags for all 8 enabled languages
 * plus `x-default` pointing at the EN URL. Produces 8 <url> blocks (SEO-07).
 */
export function localizedUrlEntries(origin: string, path: string, lastmod?: string) {
  const alternates = localeAlternates(path);
  const links = alternates
    .map((alt) => `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.htmlLang)}" href="${escapeXml(`${origin}${alt.path}`)}"/>`)
    .concat([`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${origin}${alternates[0].path}`)}"/>`])
    .join('\n');
  return alternates
    .map((alt) => {
      const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(`${origin}${alt.path}`)}</loc>${lastmodLine}\n${links}\n  </url>`;
    })
    .join('\n');
}
