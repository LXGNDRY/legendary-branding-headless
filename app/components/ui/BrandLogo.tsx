import {Image} from '@shopify/hydrogen';

/**
 * The Legendary Branding logo mark -- the exact file the owner uploaded to
 * Shopify Files (Timeless_Style_-_Artboard_22_3.png): a white goat
 * silhouette with a black star cutout for the eye. Served directly from
 * the Shopify CDN via Hydrogen's <Image> (for its automatic responsive
 * srcset) rather than a copy bundled into the repo -- the file itself is
 * never resized, cropped, or re-encoded before reaching this component.
 *
 * White fill only reads against this site's dark theme -- every current
 * call site places it on a dark header/footer background.
 *
 * Empty alt text: every current call site places this immediately next to
 * the visible "LEGENDARY" wordmark inside the same link, so a real alt
 * value would make assistive tech announce a redundant
 * "Legendary Branding LEGENDARY". Pass a real `alt` if it's ever used
 * standalone, without adjacent text.
 */
const LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0490/1391/5801/files/Timeless_Style_-_Artboard_22_3.png?v=1790112619';

export default function BrandLogo({
  className,
  alt = '',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      data={{
        url: LOGO_URL,
        altText: alt,
        width: 1467,
        height: 768,
      }}
      className={className}
      sizes="40px"
    />
  );
}
