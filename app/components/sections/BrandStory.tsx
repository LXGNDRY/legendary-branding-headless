import {Image} from '@shopify/hydrogen';

interface BrandStoryImage {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface BrandStoryProps {
  eyebrow?: string;
  heading: string;
  body: string;
  buttonLabel?: string;
  buttonLink?: string;
  image?: BrandStoryImage | null;
  imagePosition?: 'left' | 'right';
}

/**
 * HANSSEN — Brand Story Section
 * Editorial image + text split with serif display heading.
 */
export default function BrandStory({
  eyebrow,
  heading,
  body,
  buttonLabel,
  buttonLink,
  image,
  imagePosition = 'left',
}: BrandStoryProps) {
  const contentOrder = imagePosition === 'right' ? 'md:order-first' : '';

  return (
    <section className="h-section bg-[#FAF9F6] h-reveal overflow-hidden">
      <div className="h-container">
        <div
          className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center`}
        >
          {/* Image */}
          <div className={`relative overflow-hidden rounded-lg aspect-[4/5] ${imagePosition === 'right' ? 'md:order-last' : ''}`}>
            {image?.url ? (
              <Image
                data={image}
                aspectRatio="4/5"
                width={800}
                height={1000}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 bg-[#F3F2EE] flex items-center justify-center">
                <span className="h-eyebrow">Brand Image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`flex flex-col justify-center ${contentOrder}`}>
            {eyebrow && (
              <p className="h-eyebrow mb-5">{eyebrow}</p>
            )}
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] font-serif font-normal mb-6">
              {heading}
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-8 max-w-md text-[1rem]">
              {body}
            </p>
            {buttonLabel && buttonLink && (
              <a href={buttonLink} className="h-btn-primary w-fit">
                {buttonLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
