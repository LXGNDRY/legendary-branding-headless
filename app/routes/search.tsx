import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';

export const meta: MetaFunction = () => [
  {title: 'Search — LEGENDARY BRANDING'},
  {name: 'description', content: 'Search Legendary Branding products and articles.'},
];

export async function loader() {
  return {};
}

export default function SearchPage() {
  return (
    <Container className="py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>

        {/* Search input */}
        <form method="get" action="/search" className="mb-12">
          <div className="flex gap-0 border border-[#0a0a0a]">
            <label htmlFor="search-q" className="sr-only">Search</label>
            <input
              id="search-q"
              name="q"
              type="search"
              placeholder="Search products, collections, articles…"
              autoFocus
              className="flex-1 px-5 py-4 text-sm outline-none tracking-wide placeholder:text-[#999999] bg-transparent"
            />
            <button
              type="submit"
              className="px-6 py-4 bg-[#0a0a0a] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#333333] transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-[#6b6b6b] tracking-wide">
          Full search results wired to Storefront API in Milestone 5.
        </p>
      </div>
    </Container>
  );
}
