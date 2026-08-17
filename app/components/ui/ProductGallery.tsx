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
      <div className="space-y-2">
        <Placeholder aspect="aspect-[3/4]" label={title} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="overflow-hidden rounded-lg bg-[#f7f7f7]">
        <Image
          data={active}
          aspectRatio="3/4"
          sizes="(min-width: 768px) 50vw, 100vw"
          loading="eager"
          className="w-full object-cover transition-opacity duration-300"
          key={active.url}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={img.id ?? img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`overflow-hidden rounded-lg border transition-colors ${
                i === activeIndex
                  ? 'border-[#0a0a0a]'
                  : 'border-transparent hover:border-[#e5e5e5]'
              }`}
            >
              <Image
                data={img}
                aspectRatio="1/1"
                sizes="12vw"
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
