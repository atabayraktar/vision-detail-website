import { Html, Head, Main, NextScript } from 'next/document';

// Fonts are loaded via next/font/google in _app.jsx (self-hosted, zero external request,
// automatically preloaded per-page) — no manual Google Fonts <link> needed here.
//
// Sets html[data-theme] from localStorage synchronously, before first paint — ThemeContext
// (src/context/ThemeContext.jsx) only picks this up in a useEffect, which runs AFTER
// hydration; without this inline script a returning dark-mode visitor would see a flash of
// the light theme on every load. Plain string concatenation, not JSX — this has to ship as
// a literal <script> tag evaluated by the browser before React runs at all.
const SET_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('vd-theme');
    if (stored === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fcfcfd" />
        <script dangerouslySetInnerHTML={{ __html: SET_THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
