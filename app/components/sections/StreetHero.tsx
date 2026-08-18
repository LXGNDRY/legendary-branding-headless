import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import Button from '~/components/ui/Button';
import HeroPlaceholder from '~/components/ui/HeroPlaceholder';

type ImageData = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

interface StreetHeroProps {
  eyebrow?: string;
  heading: string;
  subtext?: string;
  buttonLabel?: string;
  buttonLink?: string;
  imageLeft?: ImageData | null;
  imageRight?: ImageData | null;
  splitLayout?: boolean;
  contentAlignment?: 'bottom-left' | 'center';
  fullScreen?: boolean;
}

/**
 * LEGENDARY STREETWEAR — Editorial Hero Section
 * Full-bleed split hero for streetwear drops.
 * Ported from sections/lb-street-hero.liquid
 */
export default function StreetHero({
  eyebrow,
  heading,
  subtext,
  buttonLabel,
  buttonLink,
  imageLeft,
  imageRight,
  splitLayout = false,
  contentAlignment = 'bottom-left',
  fullScreen = false,
}: StreetHeroProps) {
  const showRight = splitLayout && imageRight && imageRight.url;
  const hasLeftImage = imageLeft && imageLeft.url;

  return (
    <section
      className={`relative overflow-hidden ${
        fullScreen ? 'min-h-[90vh]' : 'min-h-[60vh]'
      }`}
    >
      <div
        className={`flex flex-col md:flex-row h-full ${
          fullScreen ? 'min-h-[90vh]' : 'min-h-[60vh]'
        }`}
      >
        {/* Left / main image */}
        <div
          className={`relative overflow-hidden bg-[#f5f5f5] ${
            showRight ? 'md:w-1/2' : 'w-full'
          }`}
        >
          {hasLeftImage ? (
            <Image
              data={imageLeft!}
              aspectRatio={showRight ? '3/4' : '16/9'}
              width={showRight ? 800 : 1600}
              height={showRight ? 1067 : 900}
              sizes={showRight ? '50vw' : '100vw'}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="w-full h-full object-cover"
            />
          ) : (
            <HeroPlaceholder className="w-full h-full" />
          )}
        </div>

        {/* Right image (split layout) */}
        {showRight && imageRight && (
          <div className="relative overflow-hidden bg-[#f5f5f5] md:w-1/2 hidden md:block">
            <Image
              data={imageRight}
              aspectRatio="3/4"
              width={800}
              height={1067}
              sizes="50vw"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content overlay */}
      <div
        className={`absolute inset-0 flex flex-col ${
          contentAlignment === 'center'
            ? 'items-center justify-center text-center'
            : 'justify-end pb-16 md:pb-24 pl-6 md:pl-16 pr-6'
        } pointer-events-none`}
      >
        <div className="pointer-events-auto text-white max-w-2xl">
          {eyebrow && (
            <div className="mb-4 text-[0.78rem] font-medium tracking-[0.2em] uppercase opacity-90">
              {eyebrow}
            </div>
          )}
          <h1 className="mb-4">{heading}</h1>
          {subtext && (
            <p className="mb-8 text-base opacity-90 max-w-lg leading-relaxed">
              {subtext}
            </p>
          )}
          {buttonLabel && buttonLink && (
            <Button as="link" to={buttonLink} variant="solid" size="lg">
              {buttonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Dark gradient overlay for text readability */}
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-t ${
          contentAlignment === 'center'
            ? 'from-black/60 via-black/30 to-black/40'
            : 'from-black/70 via-black/20 to-transparent'
        }`}
      />
    </section>
  );
}
