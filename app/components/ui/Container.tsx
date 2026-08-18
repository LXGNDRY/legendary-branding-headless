interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Constrained container — wraps content to the design system max-width.
 *
 * Uses the `.h-container` utility class (max-width: 1440px,
 * responsive horizontal page padding). This is the single source
 * of truth for page container sizing — use this component or the
 * `.h-container` CSS class, never inline max-width/padding.
 */
export default function Container({
  children,
  className = '',
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag className={`h-container ${className}`}>
      {children}
    </Tag>
  );
}
