import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {ServerRouter} from 'react-router';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> {
  let status = responseStatusCode;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        console.error(error);
        status = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent') ?? '')) {
    await body.allReady;
  }

  // Without an explicit charset, browsers guess the document's encoding —
  // commonly falling back to Latin-1/Windows-1252 in its absence, which
  // mangles any multi-byte UTF-8 character (e.g. product titles/descriptions
  // from the Storefront API containing accented letters) into mojibake
  // ("é" -> "Ã©"). The <meta charset> tag in root.tsx's <head> is the
  // browser-facing signal; this header is the authoritative one the HTTP
  // spec expects and takes precedence when present.
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');

  return new Response(body, {
    headers: responseHeaders,
    status,
  });
}
