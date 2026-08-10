interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function Container({
  children,
  className = '',
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag
      className={`max-w-screen-xl mx-auto px-[clamp(1rem,4vw,2.5rem)] ${className}`}
    >
      {children}
    </Tag>
  );
}
