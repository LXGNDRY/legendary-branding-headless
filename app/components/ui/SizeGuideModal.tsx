import {useEffect} from 'react';
import {useFocusTrap} from '~/hooks/useFocusTrap';

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * LEGENDARY STREETWEAR — Size Guide Modal
 * Ported from snippets/lb-size-guide.liquid
 * Standard streetwear sizing chart (inches)
 */
export default function SizeGuideModal({
  open,
  onClose,
  title = 'Size Guide',
}: SizeGuideModalProps) {
  const {containerRef} = useFocusTrap(open, onClose);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="relative bg-[var(--color-bg-level-1)] rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl border border-[var(--color-border-muted)]"
      >
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-muted)] bg-[var(--color-bg-level-1)] z-10">
          <h3
            id="size-guide-title"
            className="text-sm font-semibold tracking-[0.1em] uppercase text-[var(--color-text-primary)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close size guide"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-[var(--color-text-secondary)] mb-5">
            All measurements are in inches. For the best fit, measure a
            similar garment you own and compare.
          </p>

          {/* Tops size chart */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold tracking-[0.1em] uppercase mb-3">
              Tops & Outerwear
            </h4>
            <div className="w-full text-xs border border-[var(--color-border-medium)] rounded-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface)]">
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Size
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Chest
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Length
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Shoulder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['S', '20"', '27"', '17"'],
                    ['M', '21.5"', '28"', '17.5"'],
                    ['L', '23"', '29"', '18.5"'],
                    ['XL', '24.5"', '30"', '19"'],
                    ['XXL', '26"', '31"', '20"'],
                  ].map((row, i) => (
                    <tr
                      key={row[0]}
                      className={i % 2 === 0 ? 'bg-[var(--color-bg-level-2)]' : 'bg-[var(--color-surface-elevated)]'}
                    >
                      <td className="px-3 py-2 font-medium">{row[0]}</td>
                      <td className="px-3 py-2">{row[1]}</td>
                      <td className="px-3 py-2">{row[2]}</td>
                      <td className="px-3 py-2">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottoms size chart */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold tracking-[0.1em] uppercase mb-3">
              Bottoms
            </h4>
            <div className="w-full text-xs border border-[var(--color-border-medium)] rounded-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-surface)]">
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Size
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Waist
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Inseam
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-[0.7rem] tracking-[0.08em] uppercase">
                      Rise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['S', '30"', '30"', '11"'],
                    ['M', '32"', '30.5"', '11.5"'],
                    ['L', '34"', '31"', '12"'],
                    ['XL', '36"', '31"', '12.5"'],
                    ['XXL', '38"', '31"', '13"'],
                  ].map((row, i) => (
                    <tr
                      key={row[0]}
                      className={i % 2 === 0 ? 'bg-[var(--color-bg-level-2)]' : 'bg-[var(--color-surface-elevated)]'}
                    >
                      <td className="px-3 py-2 font-medium">{row[0]}</td>
                      <td className="px-3 py-2">{row[1]}</td>
                      <td className="px-3 py-2">{row[2]}</td>
                      <td className="px-3 py-2">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fit tips */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.1em] uppercase mb-3">
              Fit Notes
            </h4>
            <ul className="text-xs text-[var(--color-text-primary)] space-y-2 list-disc pl-4">
              <li>Fits true to size. For a relaxed fit, size up one.</li>
              <li>Model is 6&apos;1&quot; and wears size M.</li>
              <li>All garments pre-shrunk to minimize shrinkage.</li>
              <li>Machine wash cold. Tumble dry low. Do not bleach.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
