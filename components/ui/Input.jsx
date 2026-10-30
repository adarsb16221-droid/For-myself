const FIELD = 'h-9 rounded-lg border border-outline-variant bg-surface-container-lowest dark:bg-surface-container text-on-surface text-sm transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export function Input({ className = '', ...props }) {
  return <input className={`${FIELD} w-full px-3 placeholder:text-on-surface-variant/70 ${className}`} {...props} />;
}

export function Select({ options, className = '', ...props }) {
  return (
    <select className={`${FIELD} px-2 pr-7 cursor-pointer ${className}`} {...props}>
      {options.map(option => {
        const { value, label } = typeof option === 'string' ? { value: option, label: option } : option;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
  );
}
