import type {LoaderFunctionArgs} from 'react-router';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const host = url.hostname;

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${host}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
