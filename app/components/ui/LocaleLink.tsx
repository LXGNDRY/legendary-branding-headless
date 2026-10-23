/**
 * Locale-preserving Link. Reads the active locale from the browser URL and
 * prefixes site-relative `to` values so client-side navigation does not drop
 * the current language. Routes are registered under every supported prefix
 * in `app/routes.ts`, so the prefixed target resolves to the same handler
 * and `storefront.i18n` continues to carry the right language.
 *
 * Pass-through cases (returned unchanged):
 *   - already prefixed site-relative paths (`/de/...`)
 *   - absolute URLs (`https://...`) and protocol-relative paths (`//...`)
 *   - fragment-only (`#foo`), mailto:, tel:, and non-string `to` (object form)
 *
 * Use this instead of the raw `react-router` `Link` for any internal link that
 * must stay in-locale. See SEO-07 in docs/HYDROGEN_TECHNICAL_SEO_PLAN.md.
 */
import {Link, useLocation, type LinkProps} from 'react-router';
import {forwardRef} from 'react';
import {hasLocalePrefix, localizePath, parseLocalizedPath} from '~/lib/locale';

export const LocaleLink = forwardRef<HTMLAnchorElement, LinkProps>(function LocaleLink({to, ...rest}, ref) {
  const location = useLocation();
  const {language} = parseLocalizedPath(location?.pathname ?? '/');
  let localized: LinkProps['to'] = to;
  if (
    language !== 'EN' &&
    typeof to === 'string' &&
    to.startsWith('/') &&
    !to.startsWith('//') &&
    !hasLocalePrefix(to)
  ) {
    localized = localizePath(to, language);
  }
  return <Link ref={ref} to={localized} {...rest} />;
});

export default LocaleLink;
