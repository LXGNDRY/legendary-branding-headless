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
    <div className="bg-[#FAF9F6]">
      {/* Page header */}
      <div className="border-b border-[#E8E6E1] bg-white">
        <div className="h-container py-12 md:py-16">
          <p className="h-eyebrow text-[#9E9C97] mb-3">DOCS</p>
          <h1 className="font-serif font-normal text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-[#1A1A1A]">
            Theme Documentation
          </h1>
          <p className="text-[#6B6B6B] text-lg mt-3 max-w-2xl">
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
