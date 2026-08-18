import {Link} from 'react-router';

interface NavLink {
  label: string;
  href: string;
  isIndex?: boolean;
}

interface NavGroup {
  title: string;
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Getting Started',
    links: [
      {label: 'Overview', href: '/docs', isIndex: true},
    ],
  },
  {
    title: 'Design System',
    links: [
      {label: 'Hanssen Design System', href: '/docs/hanssen-design-system'},
    ],
  },
  {
    title: 'Changelogs',
    links: [
      {label: 'Phase 5 — Functional', href: '/docs/phase5-functional-changelog'},
    ],
  },
];

interface DocsSidebarProps {
  currentPath: string;
}

export default function DocsSidebar({currentPath}: DocsSidebarProps) {
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-24 space-y-8">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="h-eyebrow text-[#9E9C97] mb-4">
              {group.title}
            </h4>
            <ul className="space-y-2">
              {group.links.map((link) => {
                const isActive = link.isIndex
                  ? currentPath === '/docs'
                  : currentPath === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={`block text-sm py-1.5 transition-colors ${
                        isActive
                          ? 'text-[#1A1A1A] font-medium'
                          : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
