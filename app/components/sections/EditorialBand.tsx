import {Link} from 'react-router';
import {useReveal} from '~/hooks/useReveal';

interface EditorialBandProps {
  eyebrow?: string;
  heading: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  theme?: 'dark' | 'light';
}

export default function EditorialBand({
  eyebrow,
  heading,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  theme = 'dark',
}: EditorialBandProps) {
  const ref = useReveal<HTMLElement>();

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#1A1A1A]' : 'bg-[#FAF9F6]';
  const eyebrowColor = isDark ? 'text-[#FAF9F6]/40' : 'text-[#6B6B6B]';
  const textColor = isDark ? 'text-[#FAF9F6]' : 'text-[#1A1A1A]';
  const bodyColor = isDark ? 'text-[#FAF9F6]/60' : 'text-[#6B6B6B]';

  return (
    <section ref={ref} className={`h-reveal h-section ${bg}`}>
      <div className="h-container max-w-3xl text-center">
        {eyebrow && (
          <p className={`h-eyebrow mb-5 ${eyebrowColor}`}>{eyebrow}</p>
        )}
        <h2 className={`font-serif font-normal text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.01em] mb-6 ${textColor}`}>
          {heading}
        </h2>
        {body && (
          <p className={`text-[1rem] leading-relaxed mb-10 max-w-[50ch] mx-auto ${bodyColor}`}>
            {body}
          </p>
        )}
        {(primaryLabel || secondaryLabel) && (
          <div className="flex flex-wrap gap-3 justify-center">
            {primaryLabel && primaryHref && (
              <Link
                to={primaryHref}
                className={isDark
                  ? 'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase border border-[#FAF9F6] text-[0.75rem] px-7 py-3.5 rounded-full text-[#FAF9F6] hover:bg-[#FAF9F6] hover:text-[#1A1A1A] transition-all duration-200 hover:-translate-y-px'
                  : 'h-btn-primary'}
              >
                {primaryLabel}
              </Link>
            )}
            {secondaryLabel && secondaryHref && (
              <Link
                to={secondaryHref}
                className={isDark
                  ? 'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.12em] uppercase text-[0.75rem] px-7 py-3.5 text-[#FAF9F6]/60 hover:text-[#FAF9F6] transition-colors underline-offset-4 hover:underline'
                  : 'h-btn-outline'}
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
