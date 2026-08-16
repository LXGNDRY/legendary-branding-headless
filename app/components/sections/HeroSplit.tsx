import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
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
    <section className="w-full min-h-[90dvh] grid grid-cols-1 lg:grid-cols-[2fr_1fr] overflow-hidden">
      {/* Left — large product image with bottom-left overlay */}
      <div className="relative min-h-[60dvh] lg:min-h-[90dvh] bg-[#1A1A1A] overflow-hidden">
        {leftImage?.url ? (
          <Image
            data={leftImage}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-[8s] ease-out hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 67vw"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-[#1A1A1A]" />
        )}
        {/* Bottom-left label */}
        <div className="absolute bottom-8 left-8 z-10">
          {leftProduct && (
            <Link
              to={`/products/${leftProduct.handle}`}
              className="h-eyebrow text-[#FAF9F6]/70 hover:text-[#FAF9F6] transition-colors"
            >
              {leftProduct.title}
            </Link>
          )}
        </div>
      </div>

      {/* Right — content + optional second image */}
      <div className="flex flex-col bg-[#FAF9F6]">
        {/* Second product thumbnail */}
        {rightImage?.url && (
          <div className="relative flex-1 min-h-[30vh] bg-[#F3F2EE] overflow-hidden">
            <Image
              data={rightImage}
              className="absolute inset-0 w-full h-full object-cover object-center"
              sizes="33vw"
              loading="eager"
            />
            {rightProduct && (
              <div className="absolute bottom-5 left-5">
                <Link
                  to={`/products/${rightProduct.handle}`}
                  className="h-eyebrow text-[#FAF9F6]/70 hover:text-[#FAF9F6] transition-colors"
                >
                  {rightProduct.title}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Content card */}
        <div className="flex flex-col justify-end p-8 lg:p-10 gap-6 flex-1">
          {eyebrow && (
            <p className="h-eyebrow">{eyebrow}</p>
          )}
          <h1 className="font-serif font-normal text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] tracking-[-0.01em] text-[#1A1A1A]">
            {heading}
          </h1>
          {subtext && (
            <p className="text-[#6B6B6B] text-[0.95rem] leading-relaxed max-w-[28ch]">
              {subtext}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to={primaryHref} className="h-btn-primary">
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link to={secondaryHref} className="h-btn-outline">
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
