// Small hanger-in-a-square logo used in the navbar and on auth cards.
// size: pixel width/height. Decorative only (hidden from screen readers).
function BrandMark({ size = 28 }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="#8C3A1E" />
      <path
        d="M16 7.2c1.5 0 2.7 1.2 2.7 2.7 0 1.2-.8 2.2-1.9 2.5v1.3h-1.6v-1.3c-1.1-.3-1.9-1.3-1.9-2.5 0-1.5 1.2-2.7 2.7-2.7z"
        fill="#F3EFE9"
      />
      <path d="M8.2 15.1h15.6c-2 1-4.5 1.7-7.8 1.7s-5.8-.7-7.8-1.7z" fill="#F3EFE9" />
      <path
        d="M11.2 17.2h9.6v7.2c0 .9-.7 1.6-1.6 1.6h-6.4c-.9 0-1.6-.7-1.6-1.6v-7.2z"
        fill="#F0E2D8"
      />
      <path d="M16 17.2v9" stroke="#E4DDD3" strokeWidth="1.4" />
    </svg>
  );
}

export default BrandMark;
