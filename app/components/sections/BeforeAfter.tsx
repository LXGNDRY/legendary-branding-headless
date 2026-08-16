'use client';

import {useState, useRef, useCallback} from 'react';
import {Image} from '@shopify/hydrogen';

interface BAImage {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface BeforeAfterProps {
  eyebrow?: string;
  heading?: string;
  beforeImage: BAImage;
  afterImage: BAImage;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfter({
  eyebrow,
  heading,
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    move(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition((p) => Math.max(2, p - 2));
    if (e.key === 'ArrowRight') setPosition((p) => Math.min(98, p + 2));
  };

  return (
    <section className="lb-section bg-white">
      {(eyebrow || heading) && (
        <div className="lb-container mb-8">
          {eyebrow && <div className="lb-eyebrow mb-2">{eyebrow}</div>}
          {heading && <h2>{heading}</h2>}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden select-none cursor-col-resize w-full aspect-[16/9] md:aspect-[21/9]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* After (full) */}
        <div className="absolute inset-0">
          <Image
            data={afterImage}
            className="w-full h-full object-cover"
            sizes="100vw"
          />
          {afterLabel && (
            <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-[0.15em] uppercase bg-white/90 text-black px-3 py-1">
              {afterLabel}
            </span>
          )}
        </div>

        {/* Before (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{width: `${position}%`}}
        >
          <div className="absolute inset-0" style={{width: `${100 / (position / 100)}%`, maxWidth: '100vw'}}>
            <Image
              data={beforeImage}
              className="w-full h-full object-cover"
              sizes="100vw"
            />
          </div>
          {beforeLabel && (
            <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.15em] uppercase bg-white/90 text-black px-3 py-1">
              {beforeLabel}
            </span>
          )}
        </div>

        {/* Handle */}
        <div
          className="absolute inset-y-0 flex flex-col items-center z-10"
          style={{left: `${position}%`, transform: 'translateX(-50%)'}}
          role="slider"
          tabIndex={0}
          aria-label="Drag to compare before and after"
          aria-valuemin={2}
          aria-valuemax={98}
          aria-valuenow={Math.round(position)}
          onKeyDown={onKeyDown}
        >
          <div className="w-px bg-white flex-1" />
          <div className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7 5L2 10L7 15M13 5L18 10L13 15" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="w-px bg-white flex-1" />
        </div>
      </div>
    </section>
  );
}
