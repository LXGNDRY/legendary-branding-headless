import {useEffect} from 'react';
import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useFocusTrap} from '~/hooks/useFocusTrap';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  chartImage?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
  fitNote?: string;
}

/**
 * Shows the chart supplied for this product. Products without verified,
 * product-specific measurements get honest measuring guidance instead of
 * a generic chart that can misstate supplier sizing.
 */
export default function SizeGuideModal({
  open,
  onClose,
  title = 'Size Guide',
  chartImage,
  fitNote,
}: SizeGuideModalProps) {
  const {containerRef} = useFocusTrap(open, onClose);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close size guide" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] px-6 py-4">
          <h3 id="size-guide-title" className="text-sm font-semibold tracking-[0.1em] uppercase text-[var(--color-text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" aria-label="Close size guide">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" /></svg>
          </button>
        </div>
        <div className="p-6">
          {chartImage ? (
            <Image data={chartImage} alt={chartImage.altText || 'Product size chart'} width={700} sizes="(max-width: 640px) 100vw, 600px" className="mb-5 h-auto w-full" />
          ) : (
            <div className="mb-5 rounded-md border border-[var(--color-border-muted)] bg-[var(--color-bg-level-2)] p-4">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Product-specific measurements are not available for this item yet.</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">Compare the fit notes on this page with a similar garment you own. Measurements vary by product and supplier, so we do not show a generic chart as if it applied to every item.</p>
            </div>
          )}
          {fitNote && <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><span className="font-semibold text-[var(--color-text-primary)]">Fit:</span> {fitNote}</p>}
          <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">If you are between sizes or need help choosing, <Link to="/policies/contact" onClick={onClose} className="underline underline-offset-2">contact us</Link> before ordering.</p>
        </div>
      </div>
    </div>
  );
}
