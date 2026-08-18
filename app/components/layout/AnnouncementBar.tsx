import {Link} from 'react-router';

interface Announcement {
  text: string;
  link?: string;
}

interface AnnouncementBarProps {
  items?: Announcement[];
}

const DEFAULT_ITEMS: Announcement[] = [
  {text: 'Free Shipping on Orders $150+', link: '/collections/all-products'},
  {text: '235GSM+ Heavyweight Tees, Made to Order'},
  {text: 'New Drops Every Friday', link: '/collections/all-products'},
  {text: 'Worldwide Shipping Available'},
];

/**
 * ONYX — Announcement Bar
 * Top-of-page scrolling marquee with announcements.
 * Dark theme: subtle dark surface with accent highlights.
 */
export default function AnnouncementBar({items = DEFAULT_ITEMS}: AnnouncementBarProps) {
  return (
    <div className="bg-[var(--color-bg-level-2)] text-[var(--color-text-primary)] overflow-hidden border-b border-[var(--color-border-muted)]">
      <div
        className="flex whitespace-nowrap py-2 will-change-transform"
        style={{animation: 'h-announce-scroll 40s linear infinite'}}
        aria-hidden="true"
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 mx-8">
            {item.link ? (
              <Link
                to={item.link}
                className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
              >
                {item.text}
              </Link>
            ) : (
              <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
                {item.text}
              </span>
            )}
            <span className="text-[var(--color-accent)] text-xs" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
