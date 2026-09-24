import {Link} from 'react-router';
import {useTranslation, type TranslationKey} from '~/lib/i18n';

interface Announcement {
  key: TranslationKey;
  link?: string;
}

interface AnnouncementBarProps {
  items?: Announcement[];
}

const DEFAULT_ITEMS: Announcement[] = [
  {key: 'announcement.freeShipping', link: '/collections/all-products'},
  {key: 'announcement.heavyweight'},
  {key: 'announcement.newDrops', link: '/collections/all-products'},
  {key: 'announcement.worldwide'},
];

/**
 * ONYX — Announcement Bar
 * Top-of-page scrolling marquee with announcements.
 * Dark theme: subtle dark surface with accent highlights.
 */
function AnnouncementItem({item}: {item: Announcement}) {
  const t = useTranslation();
  return (
    <span className="inline-flex items-center gap-6 mx-8">
      {item.link ? (
        <Link
          to={item.link}
          className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          {t(item.key)}
        </Link>
      ) : (
        <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
          {t(item.key)}
        </span>
      )}
      <span className="text-[var(--color-accent)] text-xs" aria-hidden="true">✦</span>
    </span>
  );
}

export default function AnnouncementBar({items = DEFAULT_ITEMS}: AnnouncementBarProps) {
  return (
    <div className="bg-[var(--color-bg-level-2)] text-[var(--color-text-primary)] overflow-hidden border-b border-[var(--color-border-muted)] py-2">
      <div
        className="flex whitespace-nowrap will-change-transform motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:overflow-hidden motion-reduce:max-h-[17.6px]"
        style={{animation: 'h-announce-scroll 40s linear infinite'}}
        aria-hidden="true"
      >
        {/* Real content -- under prefers-reduced-motion this wraps and any
            row past the first (which would only ever contain whole,
            complete items -- flex-wrap never splits an item mid-text) gets
            clipped by max-height, so the bar shows as many full
            announcements as fit on one line, at its normal single-line
            height, with nothing cut off mid-item. The py-2 that used to sit
            on this element moved to the outer wrapper: padding on the
            clipped element itself is included in max-height (border-box),
            so the second row's top sliver was bleeding into that padding
            allowance before it got clipped. Padding outside the clip
            boundary avoids that entirely. */}
        {items.map((item, i) => (
          <AnnouncementItem key={`base-${i}`} item={item} />
        ))}
        {/* Duplicate copies purely for the seamless scroll loop -- hidden
            whenever the animation itself is stopped. */}
        <div className="flex motion-reduce:hidden">
          {items.map((item, i) => (
            <AnnouncementItem key={`dup1-${i}`} item={item} />
          ))}
        </div>
        <div className="flex motion-reduce:hidden">
          {items.map((item, i) => (
            <AnnouncementItem key={`dup2-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
