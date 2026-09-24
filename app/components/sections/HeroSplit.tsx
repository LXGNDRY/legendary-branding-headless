import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Button from '~/components/ui/Button';
import type {ProductCardFragment} from '~/components/ui/ProductCard';
import StarRating from '~/components/ui/StarRating';
import {parseJudgemeBadge} from '~/lib/judgeme';

// The opening hero banner mirrors the exact photography live on the Online
// Store sales channel's published theme ("Theme-Files/edits-here" ->
// templates/index.json, hero section: image_1 for desktop, image_2_mobile
// for mobile) -- these are campaign photos, not product/API data, so they're
// referenced directly from Shopify's file CDN rather than queried through
// the Storefront API (which has no endpoint for a theme section's assets).
// Each `?width=` variant below is generated on-the-fly by Shopify's image
// CDN so every breakpoint downloads only the pixels it needs.
const HERO_DESKTOP_BASE =
  'https://cdn.shopify.com/s/files/1/0490/1391/5801/files/5958342654289094365_0f2d35ea-8d96-4d70-ba9d-513592aeddf9.jpg?v=1789153351';
const HERO_MOBILE_BASE =
  'https://cdn.shopify.com/s/files/1/0490/1391/5801/files/12051419194614170644_d39726cf-d2d8-45ab-a65c-4e10d09ed173.jpg?v=1789153413';

function cdnSrcSet(base: string, widths: number[]) {
  return widths.map((w) => `${base}&width=${w} ${w}w`).join(', ');
}

const HERO_DESKTOP_WIDTHS = [960, 1440, 1920, 2400];
const HERO_MOBILE_WIDTHS = [480, 750, 1000, 1400];

interface HeroSplitProps {
  eyebrow?: string;
  heading: string;
  subtext?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  rightProduct?: ProductCardFragment | null;
}

export default function HeroSplit({
  eyebrow = 'New Season',
  heading,
  subtext,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  rightProduct,
}: HeroSplitProps) {
  const rightImage = rightProduct?.featuredImage;
  const rightProductRating = parseJudgemeBadge(rightProduct?.reviewBadge?.value);

  return (
    <section className="relative w-full bg-[var(--color-bg-level-0)] overflow-hidden">
      {/* Background: the storefront's live campaign hero, art-directed per
          breakpoint -- a <picture> with media-conditional <source>s (rather
          than one <img> scaled by CSS) so a phone only ever downloads the
          portrait mobile crop and a desktop browser only the landscape one. */}
      <div className="relative w-full min-h-[85dvh] flex items-end lg:items-center">
        <picture>
          <source
            media="(min-width: 1024px)"
            srcSet={cdnSrcSet(HERO_DESKTOP_BASE, HERO_DESKTOP_WIDTHS)}
            sizes="100vw"
          />
          <source
            srcSet={cdnSrcSet(HERO_MOBILE_BASE, HERO_MOBILE_WIDTHS)}
            sizes="100vw"
          />
          <img
            src={`${HERO_DESKTOP_BASE}&width=1920`}
            alt="Legendary Branding — Marque Légendaire streetwear"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
        </picture>
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-level-0)] via-[var(--color-bg-level-0)]/40 to-[var(--color-bg-level-0)]/20" />

        {/* Hero content — pointer-events-none on the full-width wrapper so its
            empty space (beyond max-w-2xl) doesn't sit on top of the absolutely
            positioned right-column product link on desktop; pointer-events-auto
            on the actual content restores interactivity for its text/buttons. */}
        <div className="relative z-10 w-full h-container pt-24 pb-16 lg:py-0 lg:min-h-[85dvh] lg:flex lg:items-center pointer-events-none">
          <div className="max-w-2xl pointer-events-auto">
            <p className="h-eyebrow text-white/70 mb-6">
              {eyebrow}
            </p>
            <h1 className="font-serif font-normal text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] text-white tracking-tight mb-8 whitespace-pre-line">
              {heading}
            </h1>
            {subtext && (
              <p className="text-white/70 text-base md:text-lg mb-10 max-w-md leading-relaxed">
                {subtext}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <Button
                as="link"
                to={primaryHref}
                variant="primary"
                size="lg"
              >
                {primaryLabel}
              </Button>
              {secondaryLabel && secondaryHref && (
                <Button
                  as="link"
                  to={secondaryHref}
                  variant="outline"
                  size="lg"
                  className="text-white border-white/40 hover:bg-white/10 hover:border-white"
                >
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right column secondary image (desktop) -- inset from the section's
          edges (rather than flush top/bottom/right) with rounded corners and
          a shadow so it reads as a floating featured card over the main hero
          photo, instead of a second full-bleed panel butted hard against it
          with a stark vertical seam. */}
      {rightImage?.url && rightProduct && (
        <div className="hidden lg:block absolute top-8 bottom-8 right-8 w-[36%] overflow-hidden rounded-2xl shadow-2xl">
          <Link to={`/products/${rightProduct.handle}`} className="block w-full h-full group">
            <Image
              data={rightImage}
              width={900}
              height={1200}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
              sizes="36vw"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-xs tracking-[0.15em] uppercase text-white/70 mb-2">Featured</p>
              <p className="font-serif text-2xl text-white leading-tight mb-2">
                {rightProduct.title}
              </p>
              {rightProductRating && (
                <StarRating rating={rightProductRating.rating} count={rightProductRating.count} size="sm" />
              )}
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
