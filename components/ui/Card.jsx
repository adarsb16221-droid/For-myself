export default function Card({ as: Tag = 'div', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-low ${className}`}
      {...props}
    />
  );
}
