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
  {text: '235GSM+ Heavyweight Tees, Made to Order'},
  {text: 'New Drops Every Friday', link: '/collections/all-products'},
  {text: 'Worldwide Shipping Available'},
];

/**
 * ONYX — Announcement Bar
 * Top-of-page scrolling marquee with announcements.
 * Dark theme: subtle dark surface with accent highlights.
 */
function AnnouncementItem({item}: {item: Announcement}) {
  return (
    <span className="inline-flex items-center gap-6 mx-8">
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
  );
}

export default function AnnouncementBar({items = DEFAULT_ITEMS}: AnnouncementBarProps) {
  return (
    <div className="bg-[var(--color-bg-level-2)] text-[var(--color-text-primary)] overflow-hidden border-b border-[var(--color-border-muted)]">
      <div
        className="h-announce-track flex whitespace-nowrap py-2 will-change-transform motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:py-3"
        style={{animation: 'h-announce-scroll 40s linear infinite'}}
        aria-hidden="true"
      >
        {/* Real content -- the only copy still shown once the scroll
            animation is stopped (prefers-reduced-motion). Wraps and
            centers cleanly instead of being clipped mid-item. */}
        {items.map((item, i) => (
          <AnnouncementItem key={`base-${i}`} item={item} />
        ))}
        {/* Duplicate copies purely for the seamless scroll loop -- hidden
            whenever the animation itself is stopped, so the static state
            shows each announcement exactly once. */}
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
