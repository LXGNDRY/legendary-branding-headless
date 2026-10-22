import {sanitizeHtml} from '~/lib/safe-html';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
}

/** The only place merchant/CMS HTML may be injected: always sanitized first. */
export default function SafeHtml({html, className}: SafeHtmlProps) {
  return <div className={className} dangerouslySetInnerHTML={{__html: sanitizeHtml(html)}} />;
}
