import {useState} from 'react';
import {Image} from '@shopify/hydrogen';
import Placeholder from '~/components/ui/Placeholder';

type GalleryImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export default function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!images.length) {
    return (
      <div className="space-y-3">
        <Placeholder aspect="aspect-[3/4]" label={title} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="overflow-hidden rounded-md bg-[var(--color-bg-level-2)]">
        <Image
          data={active}
          aspectRatio="3/4"
          width={900}
          height={1200}
          sizes="(min-width: 768px) 50vw, 100vw"
          loading="eager"
          fetchPriority="high"
          className="w-full object-cover transition-opacity duration-300"
          key={active.url}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 10).map((img, i) => (
            <button
              key={img.id ?? img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : 'false'}
              className={`overflow-hidden rounded-md border transition-all ${
                i === activeIndex
                  ? 'border-[var(--color-text-primary)] ring-1 ring-[var(--color-text-primary)]'
                  : 'border-[var(--color-border-muted)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              <Image
                data={img}
                aspectRatio="1/1"
                width={200}
                height={200}
                sizes="10vw"
                loading="lazy"
                className="w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
