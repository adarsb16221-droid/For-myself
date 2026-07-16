export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-4',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`rounded-full animate-spin border-primary border-t-transparent ${spinnerSize}`}
      ></div>
    </div>
  );
}
