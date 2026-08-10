import type {MetaFunction} from 'react-router';
import Container from '~/components/ui/Container';
import Placeholder from '~/components/ui/Placeholder';

export const meta: MetaFunction = () => [
  {title: 'Collections — LEGENDARY BRANDING'},
  {name: 'description', content: 'Shop all Legendary Branding collections.'},
];

export async function loader() {
  return {};
}

const COLLECTIONS = [
  {title: 'New Drops', handle: 'all-products', count: '125+'},
  {title: 'T-Shirts', handle: 'shirts-tops', count: '69'},
  {title: 'Outerwear', handle: 'hoodies-jackets', count: '33'},
  {title: 'Accessories', handle: 'accessories-more', count: '10'},
  {title: 'Sets', handle: 'sets', count: '1'},
  {title: 'Marque Légendaire', handle: 'marque-legendaire-luxury-streetwear', count: '25'},
  {title: 'Legendary Select', handle: 'legendary-select', count: '3'},
];

export default function CollectionsIndex() {
  return (
    <Container className="py-16">
      {/* Page header */}
      <div className="mb-12">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6b6b6b] mb-2">
          Shop
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          All Collections
        </h1>
      </div>

      {/* Collections grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLECTIONS.map(({title, handle, count}) => (
          <a
            key={handle}
            href={`/collections/${handle}`}
            className="group block"
          >
            <div className="relative overflow-hidden mb-4">
              <Placeholder aspect="aspect-[4/3]" label={title} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium tracking-[0.12em] uppercase group-hover:text-[#6b6b6b] transition-colors">
                {title}
              </span>
              <span className="text-xs text-[#6b6b6b]">{count} items</span>
            </div>
          </a>
        ))}
      </div>
    </Container>
  );
}
