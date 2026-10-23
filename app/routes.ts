import {type RouteConfig, type RouteConfigEntry, prefix} from '@react-router/dev/routes';
import {flatRoutes} from '@react-router/fs-routes';
import {SUPPORTED_URL_SLUGS} from './lib/locale';

/**
 * Flat routes are registered at the public origin root AND, once per enabled
 * non-default language (DE, ES, FR, HI, ID, IT, PT_BR), under the locale slug
 * prefix. One route handler serves every locale variant; language is derived
 * from the URL in `app/lib/context.ts` and threaded into `storefront.i18n` so
 * every @inContext query returns the right translation. See SEO-07 in
 * docs/HYDROGEN_TECHNICAL_SEO_PLAN.md.
 */

const flat = await flatRoutes();

function withScopedIds(entries: RouteConfigEntry[], scope: string): RouteConfigEntry[] {
  return entries.map((entry) => ({
    ...entry,
    // Route IDs are globally unique; a duplicated subtree would collide on
    // auto-generated IDs. Scope by locale slug so each copy has its own id.
    id: entry.id ? `${scope}/${entry.id}` : `${scope}/${entry.file ?? ''}`,
    children: entry.children ? withScopedIds(entry.children, scope) : undefined,
  }));
}

export default [
  ...flat,
  ...SUPPORTED_URL_SLUGS.flatMap((slug) => prefix(slug, withScopedIds(flat, slug))),
] satisfies RouteConfig;
