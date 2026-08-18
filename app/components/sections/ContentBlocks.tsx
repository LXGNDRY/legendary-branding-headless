import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';

/**
 * Content block renderer — powered by Shopify page metafields.
 *
 * Expected metafield structure (namespace "custom", key "content_blocks"):
 * A JSON array of block objects:
 * [
 *   { type: "rich_text", text: "<p>...</p>" },
 *   { type: "image_text", image: "cdn_url", title: "...", text: "...", position: "left|right" },
 *   { type: "quote", quote: "...", attribution: "..." },
 *   { type: "cta", title: "...", text: "...", button_text: "...", button_link: "/..." }
 * ]
 *
 * Metafield type: json (JSON string).
 */

interface ContentBlock {
  type: 'rich_text' | 'image_text' | 'quote' | 'cta' | 'heading';
  text?: string;
  image?: string;
  title?: string;
  quote?: string;
  attribution?: string;
  button_text?: string;
  button_link?: string;
  position?: 'left' | 'right';
}

interface ContentBlocksProps {
  blocks: ContentBlock[];
}

export default function ContentBlocks({blocks}: ContentBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-16">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <div key={i} className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-normal tracking-tight">
                  {block.title}
                </h2>
                {block.text && (
                  <p className="mt-4 text-black/60 text-sm leading-relaxed">
                    {block.text}
                  </p>
                )}
              </div>
            );

          case 'rich_text':
            return (
              <div
                key={i}
                className="max-w-3xl mx-auto prose prose-sm max-w-none text-black [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-black/70 [&_h2]:text-2xl [&_h3]:text-xl [&_li]:my-0.5"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: block.text || '',
                }}
              />
            );

          case 'image_text':
            return (
              <div
                key={i}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${
                  block.position === 'right' ? 'md:[direction:rtl]' : ''
                }`}
              >
                <div className="md:[direction:ltr]">
                  {block.image ? (
                    <img
                      src={block.image}
                      alt={block.title || 'Editorial image'}
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-[var(--color-surface)]" />
                  )}
                </div>
                <div className="md:[direction:ltr]">
                  {block.title && (
                    <h3 className="text-2xl font-normal mb-3">{block.title}</h3>
                  )}
                  {block.text && (
                    <p className="text-sm text-black/60 leading-relaxed">
                      {block.text}
                    </p>
                  )}
                </div>
              </div>
            );

          case 'quote':
            return (
              <figure key={i} className="max-w-3xl mx-auto text-center">
                <blockquote className="text-2xl md:text-3xl font-normal leading-snug tracking-tight">
                  &ldquo;{block.quote}&rdquo;
                </blockquote>
                {block.attribution && (
                  <figcaption className="mt-4 text-xs tracking-widest uppercase text-black/50">
                    — {block.attribution}
                  </figcaption>
                )}
              </figure>
            );

          case 'cta':
            return (
              <div key={i} className="bg-black text-[var(--color-text-inverse)] py-16 px-8 text-center">
                <h3 className="text-2xl md:text-3xl font-normal mb-3">
                  {block.title}
                </h3>
                {block.text && (
                  <p className="text-sm text-white/70 mb-8 max-w-md mx-auto">
                    {block.text}
                  </p>
                )}
                {block.button_text && block.button_link && (
                  <Link
                    to={block.button_link}
                    className="inline-block text-xs font-semibold tracking-widest uppercase border-2 border-white px-8 py-4 hover:bg-white hover:text-black transition-colors"
                  >
                    {block.button_text}
                  </Link>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}