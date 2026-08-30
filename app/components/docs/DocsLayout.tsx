import type {ReactNode} from 'react';
import DocsSidebar from '~/components/docs/DocsSidebar';

interface DocsLayoutProps {
  children: ReactNode;
  currentPath: string;
}

/**
 * Shared docs page layout — sidebar nav + content area.
 *
 * Usage:
 *   <DocsLayout currentPath="/docs/some-page">
 *     <h1>Page title</h1>
 *     ...content...
 *   </DocsLayout>
 */
export default function DocsLayout({children, currentPath}: DocsLayoutProps) {
  return (
    <div className="bg-[var(--color-background)]">
      {/* Page header -- the only light (bg-white) surface in an otherwise
          dark-themed app, so it deliberately does NOT reuse the dark-theme
          text tokens (--color-text-tertiary/secondary/foreground all
          resolve to near-white values meant for dark backgrounds, which
          were badly failing contrast here -- the heading in particular
          measured ~1.1:1, effectively invisible). Uses inline styles rather
          than Tailwind color utilities: app.css's hand-written `.h-eyebrow`
          and `h1` rules are unlayered CSS, which under the Cascade Layers
          spec always wins over Tailwind's `@layer utilities` classes
          regardless of selector specificity or source order -- a plain
          text-[...] class here would be silently overridden. Inline
          styles are the one thing that reliably beats that. */}
      <div className="border-b border-[var(--color-border-subtle)] bg-white">
        <div className="h-container py-12 md:py-16">
          <p className="h-eyebrow mb-3" style={{color: '#57564F'}}>DOCS</p>
          <h1
            className="font-serif font-normal text-[clamp(2rem,5vw,3.5rem)] leading-[1.05]"
            style={{color: '#0A0A0A'}}
          >
            Theme Documentation
          </h1>
          <p className="text-lg mt-3 max-w-2xl" style={{color: '#57564F'}}>
            Design system reference, changelogs, and implementation notes for the Legendary Branding headless storefront.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="h-container py-12 md:py-16">
        <div className="flex gap-12">
          <DocsSidebar currentPath={currentPath} />
          <article className="flex-1 min-w-0 max-w-3xl">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
