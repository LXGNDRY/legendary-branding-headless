import {type MetaFunction, useLocation} from 'react-router';
import DocsLayout from '~/components/docs/DocsLayout';

export const meta: MetaFunction = () => {
  const canonical = 'https://legendary-branding.com/docs/hanssen-design-system';
  return [
    {title: 'Hanssen Design System — LEGENDARY BRANDING'},
    {name: 'description', content: 'Editorial luxury streetwear design system — off-white canvas, serif headlines, accent red CTAs, Inter body.'},
    {tagName: 'link', rel: 'canonical', href: canonical},
    {property: 'og:title', content: 'Hanssen Design System'},
    {property: 'og:description', content: 'Editorial luxury streetwear — off-white canvas, serif headlines, red CTAs.'},
    {property: 'og:url', content: canonical},
  ];
};

function SectionHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h2
      id={id}
      className="font-serif text-3xl text-[#1A1A1A] mt-16 mb-6 pb-3 border-b border-[#E8E6E1] scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h3
      id={id}
      className="font-serif text-xl text-[#1A1A1A] mt-8 mb-4 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

function P({children}: {children: React.ReactNode}) {
  return <p className="text-[#1A1A1A]/80 leading-relaxed mb-4">{children}</p>;
}

function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <code className="px-1.5 py-0.5 bg-[#F3F2EE] text-sm text-[#FF3B30] rounded font-mono">
      {children}
    </code>
  );
}

function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#E8E6E1]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left h-eyebrow text-[#9E9C97] py-3 pr-4 font-normal first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#E8E6E1]/50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-3 pr-4 text-[#1A1A1A]/80 first:pl-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ColorSwatch({hex, label, usage}: {hex: string; label: string; usage: string}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-lg border border-[#E8E6E1] shrink-0"
        style={{backgroundColor: hex}}
      />
      <div>
        <p className="font-medium text-[#1A1A1A]">{label}</p>
        <p className="text-xs text-[#9E9C97] font-mono">{hex}</p>
        <p className="text-sm text-[#6B6B6B] mt-1">{usage}</p>
      </div>
    </div>
  );
}

export default function HanssenDesignSystemPage() {
  const location = useLocation();

  return (
    <DocsLayout currentPath={location.pathname}>
      <div>
        <p className="h-eyebrow text-[#FF3B30] mb-4">DESIGN SYSTEM</p>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-[#1A1A1A] mb-4 leading-tight">
          Hanssen Design System
        </h1>
        <p className="text-lg text-[#6B6B6B] leading-relaxed mb-8 max-w-2xl">
          Editorial luxury streetwear — off-white canvas, serif headlines,
          accent red CTAs, Inter body. Inspired by the Hanssen Framer template.
        </p>

        <SectionHeading id="typography">Typography</SectionHeading>

        <SubHeading id="type-scale">Type Scale</SubHeading>
        <DocTable
          headers={['Token', 'Value', 'Element']}
          rows={[
            ['--text-display-1', 'clamp(3.5rem, 8vw, 7rem)', 'Hero / page title (h1)'],
            ['--text-display-2', 'clamp(2.5rem, 5vw, 4.5rem)', 'Section heading (h2)'],
            ['--text-display-3', 'clamp(1.75rem, 3.5vw, 2.75rem)', 'Sub-section / card heading (h3)'],
            ['--text-heading-1', '1.75rem', 'UI heading (h4)'],
            ['--text-body-lg', '1.125rem', 'Lead paragraph'],
            ['--text-body', '1rem', 'Body text'],
            ['--text-small', '0.875rem', 'Secondary text'],
            ['--text-caps', '0.75rem', 'Eyebrow labels, button text'],
          ]}
        />

        <SubHeading id="font-families">Font Families</SubHeading>
        <DocTable
          headers={['Token', 'Value', 'Usage']}
          rows={[
            ['--font-serif', "Instrument Serif, serif", 'Display headings, logo, product titles'],
            ['--font-sans', 'Inter, sans-serif', 'Body, UI, buttons, labels'],
            ['--font-display', 'var(--font-serif)', 'Heading default'],
            ['--font-body', 'var(--font-sans)', 'Body default'],
            ['--font-mono', 'Menlo, monospace', 'Timer numbers, code'],
          ]}
        />

        <P>
          <strong>Heading rules:</strong> <InlineCode>font-weight: 400</InlineCode>{' '}
          (serif is never bold), <InlineCode>line-height: 1.1</InlineCode>,{' '}
          <InlineCode>letter-spacing: -0.01em</InlineCode>.
        </P>

        <SectionHeading id="color-palette">Color Palette</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ColorSwatch
            hex="#FAF9F6"
            label="Off-White"
            usage="Primary background (canvas)"
          />
          <ColorSwatch
            hex="#1A1A1A"
            label="Off-Black"
            usage="Primary text, dark sections"
          />
          <ColorSwatch
            hex="#FF3B30"
            label="Accent Red"
            usage="Buttons, badges, focus rings"
          />
          <ColorSwatch
            hex="#F3F2EE"
            label="Warm Cream"
            usage="Card surfaces, subtle backgrounds"
          />
          <ColorSwatch
            hex="#6B6B6B"
            label="Secondary Text"
            usage="Muted labels, secondary copy"
          />
          <ColorSwatch
            hex="#E8E6E1"
            label="Border"
            usage="Dividers, borders, rules"
          />
        </div>

        <SectionHeading id="spacing">Spacing</SectionHeading>
        <P>
          <strong>Scale:</strong> <InlineCode>--space-1</InlineCode> (4px) →{' '}
          <InlineCode>--space-11</InlineCode> (160px), steps double roughly every 3
          levels.
        </P>
        <DocTable
          headers={['Token', 'Value']}
          rows={[
            ['--section-padding-y', '96px (mobile default)'],
            ['--section-padding-y-md', '128px (tablet)'],
            ['--section-padding-y-lg', '160px (desktop)'],
            ['--section-padding-y-mobile', '64px'],
            ['--spacing-page-x', 'clamp(1rem, 4vw, 2.5rem)'],
          ]}
        />

        <SectionHeading id="animation">Animation</SectionHeading>
        <DocTable
          headers={['Token', 'Value', 'Usage']}
          rows={[
            ['--ease-expo', 'cubic-bezier(0.16, 1, 0.3, 1)', 'Primary easing (signature Hanssen feel)'],
            ['--ease-quart', 'cubic-bezier(0.76, 0, 0.24, 1)', 'Secondary ease'],
            ['--duration-fast', '150ms', ''],
            ['--duration-base', '200ms', ''],
            ['--duration-slow', '400ms', ''],
            ['--duration-reveal', '600ms', ''],
          ]}
        />
        <P>
          <strong>Accessibility:</strong> All animations respect{' '}
          <InlineCode>prefers-reduced-motion</InlineCode>. Reveal elements are forced
          to <InlineCode>opacity: 1</InlineCode> with no transition.
        </P>

        <SectionHeading id="utility-classes">Utility Classes</SectionHeading>
        <DocTable
          headers={['Class', 'Purpose']}
          rows={[
            ['h-section', 'Section wrapper — padding-y, bg-color'],
            ['h-container', 'Page container — max-width + side padding'],
            ['h-eyebrow', 'All-caps eyebrow label — small, tracked out, medium weight'],
            ['h-section-header', 'Section header — eyebrow + display heading'],
            ['h-btn-primary', 'Primary button — dark fill, white text, pill shape'],
            ['h-btn-outline', 'Outline button — border + dark text'],
            ['h-link', 'Link style — underline offset, hover accent color'],
            ['h-reveal', 'Scroll reveal animation (fades + slides up)'],
            ['h-stagger', 'Staggered children reveal (100ms delay per child)'],
          ]}
        />

        <p className="text-sm text-[#9E9C97] mt-12 pt-6 border-t border-[#E8E6E1]">
          Full design system reference with component catalog, section references,
          and usage guidelines is available in{' '}
          <InlineCode>docs/theme/hanssen-design-system.md</InlineCode>.
        </p>
      </div>
    </DocsLayout>
  );
}
