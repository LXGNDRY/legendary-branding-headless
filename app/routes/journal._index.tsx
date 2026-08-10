import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';

export const meta: MetaFunction = () => [
  {title: 'Journal — LEGENDARY BRANDING'},
  {
    name: 'description',
    content: 'Culture, craft, and community from Legendary Branding.',
  },
];

export async function loader() {
  return {};
}

export default function JournalIndex() {
  return (
    <Container className="py-16">
      {/* Page header */}
      <div className="mb-14 max-w-lg">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
          Editorial
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          The Journal
        </h1>
        <p className="mt-4 text-sm text-[#6b6b6b] leading-relaxed">
          Culture. Craft. Community.
        </p>
      </div>

      {/* Featured article */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14 pb-14 border-b border-[#e5e5e5]">
        <a href="/journal/article" className="group block">
          <Placeholder aspect="aspect-[4/3]" label="Featured Article Image" />
        </a>
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-3">
            Featured
          </span>
          <a href="/journal/article" className="group">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 group-hover:text-[#6b6b6b] transition-colors">
              The Ultimate Streetwear Guide 2026
            </h2>
          </a>
          <p className="text-sm text-[#6b6b6b] leading-relaxed mb-6">
            Stay Legendary, Stay Ahead. A definitive look at what defines
            premium streetwear in 2026.
          </p>
          <a
            href="/journal/article"
            className="text-xs font-semibold tracking-widest uppercase underline underline-offset-4 hover:text-[#6b6b6b] transition-colors"
          >
            Read More
          </a>
        </div>
      </div>

      {/* Article grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({length: 6}).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <article key={i} className="group">
            <a href="/journal/article" className="block mb-4">
              <Placeholder aspect="aspect-[3/2]" label="Article Image" />
            </a>
            <div className="space-y-2">
              <div className="h-2.5 bg-[#e5e5e5] rounded-sm w-1/4 animate-pulse" />
              <div className="h-3.5 bg-[#e5e5e5] rounded-sm w-full animate-pulse" />
              <div className="h-3.5 bg-[#e5e5e5] rounded-sm w-3/4 animate-pulse" />
              <div className="h-3 bg-[#e5e5e5] rounded-sm w-1/3 animate-pulse mt-3" />
            </div>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center text-xs text-[#6b6b6b] tracking-wide">
        Articles load from Shopify blog API in Milestone 6.
      </p>
    </Container>
  );
}
