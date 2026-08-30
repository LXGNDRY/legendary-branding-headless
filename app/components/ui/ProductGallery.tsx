import {useRef, useState} from 'react';
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
  const touchStartX = useRef<number | null>(null);
  const active = images[activeIndex];

  function move(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  }

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
      <div
        className="relative touch-pan-y overflow-hidden rounded-md bg-[var(--color-bg-level-2)]"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          const endX = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (startX === null || endX === undefined || Math.abs(startX - endX) < 45) return;
          move(startX > endX ? 1 : -1);
        }}
      >
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
        {images.length > 1 && (
          <>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" aria-hidden="true">
              <div
                className="h-full bg-[var(--color-text-primary)] transition-all duration-200"
                style={{width: `${((activeIndex + 1) / images.length) * 100}%`}}
              />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible">
          {images.slice(0, 10).map((img, i) => (
            <button
              key={img.id ?? img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : 'false'}
              className={`shrink-0 w-[4.5rem] snap-start overflow-hidden rounded-md border transition-all lg:w-auto ${
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
