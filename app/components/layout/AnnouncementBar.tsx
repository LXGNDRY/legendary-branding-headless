import {Link} from 'react-router';

interface Announcement {
  text: string;
  link?: string;
}

interface AnnouncementBarProps {
  items?: Announcement[];
}

const DEFAULT_ITEMS: Announcement[] = [
  {text: 'Free Shipping on Orders $100+', link: '/collections/all-products'},
  {text: '235GSM+ Heavyweight Tees — Made to Order'},
  {text: 'New Drops Every Friday', link: '/collections/all-products'},
];

/**
 * HANSSEN — Announcement Bar
 * Top-of-page scrolling marquee with announcements.
 * Uses h-announce-scroll animation from app.css.
 */
export default function AnnouncementBar({items = DEFAULT_ITEMS}: AnnouncementBarProps) {
  return (
    <div className="bg-[var(--color-foreground)] text-[var(--color-text-inverse)] overflow-hidden">
      <div
        className="flex whitespace-nowrap py-2.5 will-change-transform"
        style={{animation: 'h-announce-scroll 35s linear infinite'}}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 mx-8">
            {item.link ? (
              <Link
                to={item.link}
                className="h-eyebrow font-medium text-[var(--color-text-inverse)] hover:text-[var(--color-accent)] transition-colors"
              >
                {item.text}
              </Link>
            ) : (
              <span className="h-eyebrow font-medium text-[var(--color-text-inverse)]/80">
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
