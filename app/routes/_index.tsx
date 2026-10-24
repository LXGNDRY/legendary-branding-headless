import {type LoaderFunctionArgs, type MetaFunction, useLoaderData} from 'react-router';
import {Image} from '@shopify/hydrogen';
import LocaleLink from '~/components/ui/LocaleLink';
import ProductCard, {PRODUCT_CARD_FRAGMENT, type ProductCardFragment} from '~/components/ui/ProductCard';
import {CacheLong, CacheShort} from '~/lib/cache';
import {MAIN_MENU_QUERY, NAV_COLLECTIONS_QUERY, resolveMenuCollections, type MenuItemNode} from '~/lib/nav';
import {ROUTES, canonicalLocaleUrl} from '~/lib/site';

const HOMEPAGE_QUERY = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  query Homepage($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    newDrops: collection(handle: "all-products") { title handle products(first: 8, sortKey: CREATED, reverse: true) { nodes { ...ProductCard } } }
    recentlyAdded: collection(handle: "all-products") { products(first: 20, sortKey: CREATED, reverse: true) { nodes { ...ProductCard } } }
    marqueLegendaire: collection(handle: "marque-legendaire-luxury-streetwear") { title handle image { url altText width height } products(first: 4, sortKey: BEST_SELLING) { nodes { ...ProductCard } } }
  }
` as const;

export const meta: MetaFunction = ({matches}) => [
  {title: 'LEGENDARY BRANDING | Wear the Weight'},
  {name: 'description', content: 'Heavyweight streetwear built with intention.'},
  {tagName: 'link', rel: 'canonical', href: canonicalLocaleUrl(ROUTES.home, matches)},
  {property: 'og:type', content: 'website'},
  {property: 'og:title', content: 'LEGENDARY BRANDING | Wear the Weight'},
  {property: 'og:description', content: 'Heavyweight streetwear built with intention.'},
  {property: 'og:url', content: canonicalLocaleUrl(ROUTES.home, matches)},
  {name: 'twitter:card', content: 'summary_large_image'},
];

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const variables = {country: storefront.i18n.country, language: storefront.i18n.language};
  const [{newDrops, recentlyAdded, marqueLegendaire}, menuResult] = await Promise.all([
    storefront.query(HOMEPAGE_QUERY, {variables, cache: CacheShort()}),
    storefront.query(MAIN_MENU_QUERY, {variables, cache: CacheLong()}),
  ]);
  const items = (menuResult.menu?.items ?? []) as MenuItemNode[];
  const ids = items.filter((item) => item.type === 'COLLECTION' && item.resourceId).map((item) => item.resourceId!);
  const collections = ids.length ? resolveMenuCollections(items, (await storefront.query(NAV_COLLECTIONS_QUERY, {variables: {ids, ...variables}, cache: CacheLong()})).nodes) : [];
  const categoryItems = collections.filter((collection) => collection.handle !== 'all-products' && collection.handle !== 'marque-legendaire-luxury-streetwear');
  const ratedProducts = (recentlyAdded?.products?.nodes ?? []) as ProductCardFragment[];
  return {newDrops, signature: marqueLegendaire, collections: categoryItems, categoryItems, ratedProducts};
}

function Arrow() { return <span aria-hidden="true">↗</span>; }

export default function Homepage() {
  const {newDrops, signature, collections} = useLoaderData<typeof loader>();
  const products = (newDrops?.products?.nodes ?? []) as ProductCardFragment[];
  const signatureProducts = (signature?.products?.nodes ?? []) as ProductCardFragment[];
  const heroProduct = products[0];
  return <div className="lb-home">
    <section className="lb-hero">
      {heroProduct?.featuredImage && <Image data={heroProduct.featuredImage} width={2400} sizes="100vw" loading="eager" className="lb-hero-image" />}
      <div className="lb-hero-content"><p className="lb-label lb-label-light">Legendary Branding / Current drop</p><h1>Wear the<br />weight.</h1><p className="lb-hero-copy">Heavyweight streetwear for people who make their own reference points.</p><div className="lb-actions"><LocaleLink className="lb-button lb-button-red" to="/collections/all-products">Enter the drop <Arrow /></LocaleLink><LocaleLink className="lb-button lb-button-light" to="/collections">Shop all pieces</LocaleLink></div></div>
      <div className="lb-spec"><strong>220<br />GSM+</strong><span>Made to order<br />Built for repeat wear</span></div>
    </section>
    <div className="lb-ticker" aria-label="Legendary values"><div>HEAVYWEIGHT FABRIC <b>✦</b> BOXED SILHOUETTES <b>✦</b> MADE TO ORDER <b>✦</b> LIMITED GRAPHICS <b>✦</b> BUILT FOR REPEAT WEAR <b>✦</b></div></div>
    <section className="lb-section"><header className="lb-section-head"><div><p className="lb-label">Choose your entry point</p><h2>Start here.</h2></div><p>Pick a direction, then find the piece that stays in rotation.</p></header><div className="lb-pathways">{collections.slice(0, 3).map((collection, index) => <LocaleLink to={collection.url} key={collection.id} className="lb-path">{collection.image && <Image data={collection.image} width={900} sizes="(min-width: 800px) 33vw, 100vw" loading="lazy" />}<span>0{index + 1} / Collection</span><h3>{collection.title}</h3><p>Explore the pieces built for this part of the rotation.</p><Arrow /></LocaleLink>)}</div></section>
    <section className="lb-trust" aria-label="Brand values"><div><b>Heavyweight</b>Substance in every piece</div><div><b>Limited runs</b>Designed to stay specific</div><div><b>Built for rotation</b>Made to be worn often</div><div><b>Secure checkout</b>Shop Pay, Apple Pay, and major cards</div></section>
    {products.length > 0 && <section className="lb-section lb-products-band"><header className="lb-section-head"><div><p className="lb-label">Shop the live catalog</p><h2>In rotation.</h2></div><p>Heavyweight tees, graphic hoodies, and essentials sourced from the live Shopify catalog.</p></header><div className="lb-product-grid">{products.slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} loading={index === 0 ? 'eager' : 'lazy'} showQuickAdd />)}</div></section>}
    <section className="lb-dark-band"><div><p className="lb-label lb-label-red">Fabric system / Know your GSM</p><h2>The difference<br />is in the weight.</h2></div><p>Fabric weight changes the way a piece feels, falls, and holds its shape. We build for structure, presence, and repeat wear.</p></section>
    {signatureProducts.length > 0 && <section className="lb-section lb-signature"><header className="lb-section-head"><div><p className="lb-label">The signature collection</p><h2>{signature?.title ?? 'Marque Légendaire'}</h2></div><LocaleLink className="lb-button" to={`/collections/${signature?.handle}`}>Enter collection <Arrow /></LocaleLink></header><div className="lb-product-grid">{signatureProducts.map((product) => <ProductCard key={product.id} product={product} showQuickAdd />)}</div></section>}
    <section className="lb-statement"><p className="lb-label">Legendary point of view</p><h2>Clothes with<br />a point of view.</h2></section>
    <section className="lb-section lb-values"><header className="lb-section-head"><div><p className="lb-label">Our position</p><h2>What we<br />stand for.</h2></div><p>The brand is not just the garment. It is the standard behind it.</p></header><div className="lb-value-grid"><article><span>01 / Substance</span><h3>Make it<br />feel real.</h3><p>Texture, weight, construction, and the feeling of a piece in your hands.</p></article><article><span>02 / Expression</span><h3>Make it<br />mean something.</h3><p>Graphic language gives every garment a voice.</p></article><article><span>03 / Longevity</span><h3>Make it<br />stay.</h3><p>Designed for repeat wear and a wardrobe that grows more personal over time.</p></article></div></section>
    <section className="lb-final"><div><p className="lb-label lb-label-light">Final call</p><h2>Find your<br />piece.</h2></div><div><p>Enter the latest drop or build your rotation from the signature collection.</p><LocaleLink className="lb-button lb-button-red" to="/collections/all-products">Shop new arrivals <Arrow /></LocaleLink></div></section>
  </div>;
}
