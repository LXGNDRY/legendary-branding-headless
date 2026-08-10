import type {MetaFunction, LoaderFunctionArgs} from 'react-router';
import {useParams} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: `${data?.title ?? 'Article'} — The Journal — LEGENDARY BRANDING`},
];

export async function loader({params}: LoaderFunctionArgs) {
  const articleHandle = params.articleHandle ?? '';
  // Storefront API call wired up in Milestone 6
  return {
    articleHandle,
    title: articleHandle
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default function ArticlePage() {
  const {articleHandle} = useParams();
  const title = articleHandle?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Article';

  return (
    <article>
      {/* Hero image */}
      <div className="w-full aspect-[16/7] bg-[#f7f7f7]">
        <Placeholder
          aspect="aspect-auto"
          label="Article Hero"
          className="w-full h-full"
        />
      </div>

      <Container className="py-14">
        {/* Article header */}
        <header className="max-w-2xl mx-auto text-center mb-12">
          <nav className="mb-6 text-[11px] tracking-widest uppercase text-[#6b6b6b]" aria-label="Breadcrumb">
            <a href="/journal" className="hover:text-[#0a0a0a] transition-colors">
              Journal
            </a>
            <span className="mx-2">/</span>
            <span className="text-[#0a0a0a]">{title}</span>
          </nav>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-4">
            Editorial
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-4 text-xs text-[#6b6b6b] tracking-wide">
            Published — Legendary Branding Journal
          </p>
        </header>

        {/* Article body skeleton */}
        <div className="max-w-2xl mx-auto space-y-4">
          {Array.from({length: 8}).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={i}
              className={`h-3 bg-[#e5e5e5] rounded-sm animate-pulse ${
                i % 4 === 3 ? 'w-2/3' : 'w-full'
              }`}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-[#6b6b6b] tracking-wide">
          Full article content loads from Shopify blog API in Milestone 6.
        </p>

        {/* Back link */}
        <div className="mt-16 text-center">
          <a
            href="/journal"
            className="text-xs font-semibold tracking-widest uppercase border-b border-[#0a0a0a] pb-0.5 hover:border-[#6b6b6b] hover:text-[#6b6b6b] transition-colors"
          >
            ← Back to Journal
          </a>
        </div>
      </Container>
    </article>
  );
}
