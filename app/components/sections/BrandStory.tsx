import {Image} from '@shopify/hydrogen';
import Button from '~/components/ui/Button';

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
    <section className="lb-section bg-white overflow-hidden">
      <div
        className={`grid md:grid-cols-2 min-h-[480px] ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}
      >
        {/* Image */}
        <div className={`relative bg-[#f5f5f5] overflow-hidden min-h-[360px] md:min-h-0 ${imagePosition === 'right' ? 'md:order-last' : ''}`}>
          {image?.url ? (
            <Image
              data={image}
              className="absolute inset-0 w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[#f0ede8] flex items-center justify-center">
              <span className="text-[10px] tracking-widest uppercase text-[#999]">
                Brand Image
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`flex flex-col justify-center px-8 md:px-16 py-14 ${contentOrder}`}
        >
          {eyebrow && (
            <p className="lb-eyebrow mb-4">{eyebrow}</p>
          )}
          <h2 className="text-3xl md:text-4xl font-normal leading-tight mb-6">
            {heading}
          </h2>
          <p className="text-black/60 leading-relaxed mb-8 max-w-md">{body}</p>
          {buttonLabel && buttonLink && (
            <div>
              <Button as="link" to={buttonLink} variant="solid" size="md">
                {buttonLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
