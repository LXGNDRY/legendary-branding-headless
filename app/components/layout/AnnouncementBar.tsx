import {Link} from 'react-router';

interface Announcement {
  text: string;
  link?: string;
}

interface AnnouncementBarProps {
  items?: Announcement[];
}

const DEFAULT_ITEMS: Announcement[] = [
  {text: 'FREE SHIPPING ON ORDERS $100+', link: '/collections/all-products'},
  {text: '235GSM+ HEAVYWEIGHT TEES — MADE TO ORDER'},
  {text: 'NEW DROPS EVERY FRIDAY', link: '/collections/all-products'},
];

export default function AnnouncementBar({items = DEFAULT_ITEMS}: AnnouncementBarProps) {
  return (
    <div className="bg-[#0a0a0a] text-white overflow-hidden">
      <div
        className="flex whitespace-nowrap py-2 will-change-transform"
        style={{animation: 'lb-announce-scroll 30s linear infinite'}}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 mx-6">
            {item.link ? (
              <Link
                to={item.link}
                className="text-[10px] font-medium tracking-[0.2em] uppercase hover:text-white/70 transition-colors"
              >
                {item.text}
              </Link>
            ) : (
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/80">
                {item.text}
              </span>
            )}
            <span className="text-white/30 text-[8px]" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes lb-announce-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
