import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Button from '~/components/ui/Button';
import type {ProductCardFragment} from '~/components/ui/ProductCard';

interface HeroSplitProps {
  eyebrow?: string;
  heading: string;
  subtext?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  leftProduct?: ProductCardFragment | null;
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
  leftProduct,
  rightProduct,
}: HeroSplitProps) {
  const leftImage = leftProduct?.featuredImage;
  const rightImage = rightProduct?.featuredImage;

  return (
    <section className="relative w-full bg-[var(--color-bg-level-0)] overflow-hidden">
      {/* Background: full-width product image with dark overlay */}
      <div className="relative w-full min-h-[85dvh] flex items-end lg:items-center">
        {leftImage?.url ? (
          <>
            <Image
              data={leftImage}
              width={1800}
              height={2200}
              className="absolute inset-0 w-full h-full object-cover object-center"
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-level-0)] via-[var(--color-bg-level-0)]/40 to-[var(--color-bg-level-0)]/20" />
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-bg-level-1)]" />
        )}

        {/* Hero content */}
        <div className="relative z-10 w-full h-container pt-24 pb-16 lg:py-0 lg:min-h-[85dvh] lg:flex lg:items-center">
          <div className="max-w-2xl">
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

      {/* Right column secondary image (desktop) */}
      {rightImage?.url && rightProduct && (
        <div className="hidden lg:block absolute top-0 right-0 h-full w-[38%] overflow-hidden border-l border-[var(--color-border-muted)]">
          <Link to={`/products/${rightProduct.handle}`} className="block w-full h-full group">
            <Image
              data={rightImage}
              width={900}
              height={1200}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-[var(--ease-expo)] group-hover:scale-[1.04]"
              sizes="38vw"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-xs tracking-[0.15em] uppercase text-white/70 mb-2">Featured</p>
              <p className="font-serif text-2xl text-white leading-tight">
                {rightProduct.title}
              </p>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
