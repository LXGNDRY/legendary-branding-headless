import {useWishlist} from '~/components/ui/Wishlist';

interface WishlistButtonProps {
  product: {
    id: string;
    handle: string;
    title: string;
    price: string;
    image?: string;
  };
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Heart-shaped wishlist toggle button.
 *
 * Uses the WishlistContext — must be rendered inside WishlistProvider.
 * Solid = in wishlist, outline = not in wishlist.
 */
export default function WishlistButton({
  product,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const {isInWishlist, toggle} = useWishlist();
  const inWishlist = isInWishlist(product.handle);

  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      className={`p-1 hover:opacity-70 transition-opacity ${className}`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={sizeClasses}
        viewBox="0 0 24 24"
        fill={inWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
