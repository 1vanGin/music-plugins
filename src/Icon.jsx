const glyphs = {
  library: <path d="M4 5h16M4 12h16M4 19h11" />,
  search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  star: <path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9Z" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  external: <path d="M14 3h7v7m0-7L11 13M10 3H3v18h18v-7" />,
};

export default function Icon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{glyphs[name]}</svg>;
}
