/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan index.html for class usage. The JS template strings inside
  // index.html contain dynamic class fragments; they all appear as
  // string literals in the file so Tailwind's content scanner catches
  // them without a safelist.
  content: ['./index.html'],
  // Tailwind CSS resets `font-family: inherit` across the board; that
  // would strip Fraunces/IBM Plex off elements that don't carry an
  // explicit class. We preserve the custom font families here so the
  // design system still works after the CDN JIT is gone.
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', '"Source Serif Pro"', 'Georgia', 'serif'],
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
