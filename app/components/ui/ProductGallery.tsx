import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
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
  badges,
  selectedImage,
}: {
  images: GalleryImage[];
  title: string;
  /** Optional overlay content (e.g. Sale / low-stock badges) pinned to the top-left of the main image. */
  badges?: ReactNode;
  /**
   * The currently selected variant's own image (e.g. a color swatch's
   * distinct photo). When it changes, the gallery jumps to the matching
   * image -- without this, picking a color variant left the gallery
   * showing whatever image happened to be active, never the variant's own
   * photo. If the variant's image isn't among `images` (the product query
   * only fetches the first 10), it's added to the gallery rather than
   * silently failing to match.
   */
  selectedImage?: GalleryImage | null;
}) {
  // Guarantees the selected variant's photo is always reachable, even for
  // a product with more than 10 images (the product query's `images(first:
  // 10)` page) whose variant image falls outside that page.
  const galleryImages = useMemo(() => {
    if (!selectedImage || images.some((img) => img.url === selectedImage.url)) {
      return images;
    }
    return [selectedImage, ...images];
  }, [images, selectedImage]);

  function indexOfSelected(list: GalleryImage[]) {
    if (!selectedImage) return -1;
    return list.findIndex((img) => img.url === selectedImage.url);
  }

  // Computed eagerly (not in an effect) so the server-rendered response --
  // and the very first client render -- already shows the right image
  // instead of visibly swapping to it post-hydration.
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = indexOfSelected(galleryImages);
    return idx === -1 ? 0 : idx;
  });
  const touchStartX = useRef<number | null>(null);
  const active = galleryImages[activeIndex];

  useEffect(() => {
    const idx = indexOfSelected(galleryImages);
    if (idx !== -1) setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage?.url, galleryImages]);

  function move(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + galleryImages.length) % galleryImages.length);
  }

  if (!galleryImages.length) {
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
          alt={active.altText || title}
          aspectRatio="3/4"
          width={900}
          height={1200}
          sizes="(min-width: 768px) 50vw, 100vw"
          loading="eager"
          fetchPriority="high"
          className="w-full object-cover transition-opacity duration-300"
          key={active.url}
        />
        {badges && (
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {badges}
          </div>
        )}
        {galleryImages.length > 1 && (
          <>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white backdrop-blur-sm">
              {activeIndex + 1} / {galleryImages.length}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" aria-hidden="true">
              <div
                className="h-full bg-[var(--color-text-primary)] transition-all duration-200"
                style={{width: `${((activeIndex + 1) / galleryImages.length) * 100}%`}}
              />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible">
          {galleryImages.slice(0, 10).map((img, i) => (
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
