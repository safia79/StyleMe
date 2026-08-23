const PATHS = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  wardrobe: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M12 4v16" />
      <path d="M8 12h.01" />
      <path d="M16 12h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </>
  ),
  weather: (
    <>
      <circle cx="8" cy="10" r="3.2" />
      <path d="M8 4.5v.8M8 14.7v.8M3.5 10h.8M11.7 10h.8M4.8 6.2l.6.6M10.6 13.2l.6.6M4.8 13.8l.6-.6M10.6 6.8l.6-.6" />
      <path d="M13 14.5h5.2a2.8 2.8 0 0 0 .2-5.6 4.4 4.4 0 0 0-8.2-1.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z" />
      <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
    </>
  ),
  recommendations: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  history: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  subscription: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </>
  ),
  builder: (
    <>
      <path d="M4 17l8-12 8 12H4z" />
      <path d="M9.5 17l2.5-4 2.5 4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18h10.5A3.5 3.5 0 0 0 18 11.1 5.5 5.5 0 0 0 7.4 10.2 3.5 3.5 0 0 0 7 18z" />
    </>
  ),
  rain: (
    <>
      <path d="M7 15h10.5A3.5 3.5 0 0 0 18 8.1 5.5 5.5 0 0 0 7.4 7.2 3.5 3.5 0 0 0 7 15z" />
      <path d="M8.5 18l.5 2M12 18.5v2M15.5 18l.5 2" />
    </>
  ),
  snow: (
    <>
      <path d="M12 5v14M6.5 8.5l11 7M6.5 15.5l11-7" />
    </>
  ),
  storm: (
    <>
      <path d="M7 15h10.5A3.5 3.5 0 0 0 18 8.1 5.5 5.5 0 0 0 7.4 7.2 3.5 3.5 0 0 0 7 15z" />
      <path d="M11 14l-2 5h3l-1 4 4-6h-3l2-3z" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
};

function UiIcon({ name, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

export default UiIcon;
