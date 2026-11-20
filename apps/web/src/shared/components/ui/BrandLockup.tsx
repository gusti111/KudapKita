type BrandLockupProps = {
  compact?: boolean;
  dark?: boolean;
  className?: string;
  showTagline?: boolean;
  name?: string;
  tagline?: string;
};

export function BrandLockup({ compact = false, dark = false, className = '', showTagline = true, name = 'KudapKita', tagline = 'TEMAN NGEMIL, DEKAT DI HATI' }: BrandLockupProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <img
        src="/brand/kudapkita-mark.svg"
        alt=""
        aria-hidden="true"
        className={`${compact ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl'} shrink-0 shadow-sm`}
      />
      <span className="min-w-0">
        <span className={`block font-serif text-[1.35rem] font-bold leading-none tracking-tight ${dark ? 'text-white' : 'text-cocoa'}`}>{name}</span>
        {showTagline && <span className={`mt-1 block text-[10px] font-semibold tracking-[.14em] ${dark ? 'text-white/60' : 'text-muted'}`}>{tagline}</span>}
      </span>
    </span>
  );
}
