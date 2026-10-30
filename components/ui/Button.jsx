const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low dark:bg-surface-container-high dark:hover:bg-surface-container-highest',
  ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5',
  danger: 'text-error hover:bg-error/10',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
