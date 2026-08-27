# CLAUDE.md — Vision Detail Frontend Rules

Project: **Vision Detail** — the Türkiye distributor of **ChemicalWorkz**, bringing German-engineered premium detailing products to professionals and car enthusiasts.
Vibe: Apple "liquid glass" — frosted, layered, luminous. Visual language is a close relative of `chemicalworkz.de` (clean, technical, premium); Vision Detail is its Türkiye extension, softened by a glass surface.
Not a template.

## Always Do First

- **Invoke both `frontend-design` and `ui-ux-pro-max` skills** before writing any frontend code, every session, no exceptions. Run them together.
- **Invoke the `seo` skill** on every page: title, description, canonical, Open Graph + Twitter card, `lang="tr"` with `hreflang` alternates for TR/EN/DE (the header has a 3-way language switcher — see Header spec below), and JSON-LD — `Organization` + `LocalBusiness` for the studio, `BreadcrumbList` sitewide, `ItemList` on the listing page, `Product` on each detail page.
- **Also run GEO (Generative Engine Optimization) work**, not just classic SEO. The goal is that AI search engines can quote this site correctly:
  - State the entity relationship in plain text on the page, not only in metadata: Vision Detail is the Türkiye distributor of ChemicalWorkz.
  - Product specs, categories and contact details live in real HTML text — never baked into images only.
  - Semantic HTML with a single clear `h1` per page and a logical heading ladder; self-contained, quotable paragraphs (no answer split across a slider the crawler can't reach).
  - `FAQPage` schema where a section genuinely answers questions (e.g. the quiz / About block), plus `sameAs` links to Instagram and WhatsApp.
  - Ship `public/llms.txt` and `public/robots.txt` that allow AI crawlers and point to the sitemap.
- If installed in this environment, also invoke skills covering **accessibility (a11y)**, **motion/animation**, and **web performance** — this build leans hard on sliders, pop-ups and `backdrop-filter`, which is exactly where those three break. Skip silently any skill that isn't installed; never invent a skill name.

## Reference Files & Brand System

- Two spec files ship with this project. **Read them before designing — they are the single source of truth. Do not invent brand colors, fonts, sections, or section order.**
  - `.claude/brand_assets/brand_guidelines.jpg` — brand definition & tone, logo variations, colour palette, typography, icon & button (liquid glass) system. Extract exact hex, font roles and the glass markup from it. (Shipped as a `.jpg` reference image, not `.html` — read it with the `Read` tool as an image.)
  - `.claude/brand_assets/design_architecture.jpg` — the page-by-page, section-by-section blueprint. Match its structure and order exactly. (Also a `.jpg` reference image.)
- **Before writing any page code, copy all image/logo/video assets to `public/images/` (video → `public/videos/`, logos → `public/logos/`).** Reference them as `/images/<file>` — never reference `.claude/` paths in code. See **Homepage Content Source** below for exactly where each asset originates and how to optimize it on the way in.
- **Logo rule (from Brand Guidelines · 02):** the **dark** variation goes on light surfaces (`#FCFCFD`), the **light** variation on dark surfaces (`#000000`). **The logo is never filled with the brand gradient.** The ChemicalWorkz logo appears in the header beside the Vision Detail logo, separated by a vertical rule, with a short info line.
- Match the design architecture's layout and structure exactly. Small refinements grounded in the brand are allowed — do not invent enhancements, do not overdo it.
- Screenshot your output, compare against the reference `.jpg`s, fix mismatches, re-screenshot. At least 2 comparison rounds. Stop only when no visible differences remain or the user says so.

## Homepage Content Source (`.claude/homepage_data/` & `.claude/logos/`)

Real homepage copy and media live in `.claude/homepage_data/`, one subfolder per Ana Sayfa section (`header`, `hero-section/hero-1..4`, `equipment-category-section`, `chemical-works-about-section`, `polishing-banner-section` incl. its `polishing-banner-pop-up` subfolder, `contact-section`). This is the **content source of truth for the homepage** — pull real copy and media from here instead of inventing placeholder text for any section that has a matching folder. Text lives in `.txt`/`.txt.txt` files (one file per copy block — title/info/CTA are usually separate lines inside one file), images ship as `.webp`, hero media ships as `.webm`/`.mov`. `.claude/logos/logo-dark.svg` and `.claude/logos/logo-light.svg` are the Vision Detail logo source files (dark-on-light and light-on-dark per the Logo rule above) — treat them the same as the header's logo files.

- **Never reference `.claude/homepage_data/` or `.claude/logos/` paths from app code.** These are raw source drops. Process each asset into `public/` (below) and reference the `public/` copy.
- **These source SVGs are not real vector art** — `logo-dark.svg`, `logo-light.svg`, and `homepage_data/header/visiondetail-logo-siyah.svg` are design-tool exports that wrap a rasterized PNG (some of it only used for an internal drop-shadow filter) inside an SVG tag, which is why they're 300KB+ for a logo. Don't ship them as-is. Rasterize at ~3x display size with a transparent background and re-encode as WebP (see Media Optimization Pipeline) — same pixels the browser would have painted anyway, a fraction of the bytes. `homepage_data/header/siyah_logo_chemicalworkz (1).svg` (the ChemicalWorkz mark) *is* genuine vector — copy it through as-is.
- Sections without a `homepage_data` folder (Contact map embed styling, Footer boilerplate, `/urunler` + `/urunler/[id]`) still use the placeholder rules under Static Site Generation below — this folder only covers what's actually been supplied.
- **Popup quiz copy** (`polishing-banner-section/polishing-banner-pop-up/`) was an empty file as of this writing — the 3–4 quiz questions and product recommendations are not yet supplied. Write reasonable placeholder questions grounded in the ChemicalWorkz polishing-machine lineup and flag them clearly as placeholder pending real quiz logic/copy.
- If a fresher `.claude/homepage_data/` conflicts with older prose elsewhere in this file (e.g. header language count), **the folder wins** — it's the newer, more specific input. Update this file's prose to match rather than leaving both versions standing.

## Media Optimization Pipeline

The user's own rule: optimize every video and image to the smallest size that doesn't visibly cost quality. Don't just copy `homepage_data` assets into `public/` — run them through this pipeline first:

- **Images (`.webp` source):** re-encode with `sharp`, sized to the largest box the design actually displays it at (×2 for retina, not larger) — equipment cards ≈ a few hundred px wide, hero/banner images ≈ full viewport width. Quality ~78–82 is the sweet spot for photographic detailing product shots; don't go lower without eyeballing the result.
- **Video (hero `.webm`/`.mov`):** re-encode with `ffmpeg`, muted (`-an`, these are silent background loops), `-movflags +faststart`. Ship H.264 MP4 (`-c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p`) as the primary `<source>` for compatibility, optionally a VP9 WebM (`-c:v libvpx-vp9 -crf 34 -b:v 0`) alongside for browsers that prefer it. Scale down from source only if the source exceeds ~1920px on the long edge.
- **Pseudo-vector logos:** see the rasterize-then-WebP approach under Homepage Content Source above — don't ship a 300KB+ SVG when the content is actually a raster image.
- **Genuine vector SVGs** (real `<path>` art, no embedded raster): copy through untouched, don't re-encode.
- After optimizing, sanity-check the before/after file size and glance at the image/video once — the goal is byte savings with no visible artifacting, not maximum compression at any cost.

### Brand tokens (mirror of brand_guidelines.html — pull, don't guess)

```
--bg:     #FCFCFD              /* page background */
--ink:    #000000              /* text + dark surfaces (secondary colour) */
--mute:   rgba(0,0,0,.58)      /* secondary text */
--faint:  rgba(0,0,0,.55)      /* tertiary / metadata — see note below */
--line:   rgba(0,0,0,.14)      /* borders */
--hair:   rgba(0,0,0,.08)      /* hairlines, dividers */

/* brand gradient — hover text only */
--g1:     #E05316
--g2:     #FE6A2E
--g3:     #FFAA49
```

**Deliberate deviation from the brand file:** `brand_guidelines.jpg` specifies `--faint` at `rgba(0,0,0,.40)`, but that measures ~3:1 against `--bg` — it fails WCAG AA's 4.5:1 minimum for the small (11–13px) metadata text this token is actually used on sitewide (header info line, About eyebrows, footer rights, contact info labels, quiz step counter). Implemented at `.55` instead, which clears AA (~4.9:1) while staying visibly lighter than `--mute`. If a future brand refresh touches this token, re-check contrast against `--bg` before accepting anything below ~`.54` opacity — don't silently revert to the brand file's literal `.40`.

**The gradient is the third colour and is used *only* on hover text.** It is never a background, never an icon fill, never body-copy colour, and it is not applied to every element — only to selected nav items and button labels, as marked in the design architecture.

```css
.gradient-text {
  background-image: linear-gradient(
    90deg,
    #E05316 0%, #FE6A2E 28%, #FFAA49 50%, #FE6A2E 72%, #E05316 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
```

- **Display / headings:** `Archivo` — weight 240, width 125 (variable axes; set `font-variation-settings`, don't fake it with `font-stretch` guesses).
- **Body / descriptions / UI:** `Hanken Grotesk` — weight 240, width 95.
- Load via Google Fonts with the variable axes requested — implemented via `next/font/google` in `_app.jsx` (self-hosted at build time, zero external font request at runtime, better Lighthouse than a raw `fonts.googleapis.com` `<link>`), not a manual `<link>` tag. **Do not manually add Google Fonts `<link>`/`<style>` tags in `_document.jsx`** — Next's `Head` component silently strips/dedupes repeated same-`href` `<link>` tags (breaks any loadCSS-style preload+swap trick), and it's redundant with `next/font` anyway. `next/font`'s `axes` option carries any non-default variable axis (e.g. `axes: ['wdth']` for Archivo's width axis) — check per-family axis support before assuming one exists (Hanken Grotesk's Google Fonts variable file only exposes `wght`, no `wdth`; the `font-variation-settings: 'wdth' ...` written for it elsewhere is a harmless no-op, not a bug). Do **not** introduce Inter, Archivo Expanded, or any third family.
- **Radius is soft, not sharp.** This brand floats; the header is an explicitly rounded pill. Define a small radius scale and use it consistently — no 0-radius architectural look.

### Liquid glass system (Brand Guidelines · 05)

Header, footer and buttons are built with the four-layer structure from the brand file — `effect` (blur + `filter: url(#glass-distortion)`), `tint`, `shine`, then content on top. The `<filter id="glass-distortion">` SVG (feTurbulence → feGaussianBlur → feDisplacementMap) is included **once per page** in a hidden SVG, not per component.

Use these exact values — they are lighter and warmer than a generic glass panel, and that difference is the brand:

```css
/* wrapper */  box-shadow: 0 6px 6px rgba(0,0,0,.1), 0 0 20px rgba(0,0,0,.05);
/* effect  */  backdrop-filter: blur(5px);
/* tint    */  background: rgba(240,238,233,.35);   /* warm, not pure white */
/* shine   */  box-shadow: inset 2px 2px 1px 0 rgba(255,255,255,.6),
                           inset -1px -1px 1px 1px rgba(255,255,255,.4);
```

The shine is deliberately asymmetric — brighter top-left, softer bottom-right — so the surface reads as lit from above. Don't even out the two insets.

Build it as a single reusable `GlassSurface` component so the layer stack exists in one place. Keep the brand's spring easing `cubic-bezier(0.175, 0.885, 0.32, 2.2)`, but scope the transition to the properties that actually change (`transform`, `box-shadow`, `backdrop-filter`) instead of `all` — same feel, no layout thrash.

## Site Structure (from design_architecture.html)

Three pages. Header and footer are identical on all three, and both are liquid glass.

**`/` (Ana Sayfa):**

- **00 Header** — liquid glass, sticky, **floating**: it never touches the top or side edges, it sits in its own rounded pill with margin on every side and blurs the content passing beneath it. Left: Vision Detail logo, vertical divider, ChemicalWorkz logo + short info text ("ChemicalWorkz Türkiye Distribütörü"). Centre: nav items as **plain text, not buttons and not glass** — label text is Ürünler / ChemicalWorkz / İletişim, and the label turns to the brand gradient on hover only. Right: language switcher (**TR / EN / DE** — per `homepage_data/header`, three languages not two) — **the only other glass element in the header**.
- **01 Hero** — slider. Full-width image or video; title, info text and a glass button sit as an overlay on top, with a light scrim over the media for legibility. Arrow controls on both sides, dot indicator below. Media and text move together on slide change; button label goes gradient on hover.
- **02 Equipment Categories** — looping slider, autoplay every 5–10s (unhurried), pauses on user interaction; also controllable by drag, swipe and arrows at both ends. Each card: image + title. On card hover the title goes gradient and the image scales slightly.
- **03 ChemicalWorkz About** — image + info text pair on top, then a row of icon + short info items beneath. Icons sit on liquid glass surfaces. Keep the brand story short; detail belongs on product pages.
- **04 Polishing Banner** — full-width banner: title + button over a wide image. The button opens a **pop-up quiz**: 3–4 questions that recommend a suitable product. The quiz opens as a liquid glass panel and blurs the content behind it.
- **05 Contact** — map on the left, contact form on the right; a single row of contact info below: phone, Instagram, address, WhatsApp. Form submit button is liquid glass. The WhatsApp icon also repeats as a fixed corner button.
- **06 Footer** — liquid glass, same construction as the header. Logo left, footer content centre, contact info right.

**`/urunler` (Ürün Listeleme):**

- **L1 Arama & Üst Bar** — search field on top; sort menu directly above the grid: Yeni Gelenler · İsim A–Z · İsim Z–A · Fiyat Artan · Fiyat Azalan. Results filter live as the user types.
- **L2 Filtre Paneli** — left column, categories with a "daha fazla göster" expander, reset control at the top. **Filters are driven by URL params so the view is shareable**; the homepage category cards deep-link here with their filter pre-applied. Selection updates the grid instantly. On mobile the panel opens as a full-screen modal.
- **L3 Ürün Grid** — card: product image, "Yeni" badge, product name, price, and an "İncele" action (glass CTA). Every product has an id; the **whole card** links to the detail page. Hover: image scales slightly, İncele label goes gradient.
- **L4 Sayfalama & Boş Durum** — pagination below the grid; when filters return nothing, an empty state with an illustration and a "filtreleri değiştir" prompt. Structural reference: `chemicalworkz.de/alle-produkte`, rendered in Vision Detail's visual language.

**`/urunler/[id]` (Ürün Detay):**

- **D1 Galeri & Ürün Bilgisi** — left: product gallery with arrow controls and thumbnails beneath. Right: product name, features, description, and colour/size selection **only for products that actually have variants**. The page's primary action is a liquid glass **"WhatsApp ile Bilgi Al"** button that opens a pre-filled message containing the product name and code.
- **D2 Ürün Poster** — full-width product poster below the info block; one poster per product.

**There is no cart and no checkout — WhatsApp is the sales channel.** Do not build commerce flows that the blueprint doesn't ask for.

## Signature Elements (the things that make this site _not_ generic)

- **The floating glass pill header** — detached from every edge, live during scroll, blurring what passes underneath. This is the first thing a visitor registers; get it exactly right.
- **Gradient-on-hover text** — the only place colour appears. Its scarcity is the point; the moment it's everywhere, the brand is gone.
- **Four-layer glass depth** — effect / tint / shine / content. Real layering, not a flat `rgba` panel with a blur slapped on.
- **Glass-language motion** — soft spring curves, transparency and blur transitions, pop-ups that fade-and-scale in while the background blurs. **No hard cuts anywhere**, including pop-up open/close, clicks and page transitions.
- **Smooth scroll + lazy reveal** — sections and images surface gently as they enter the viewport.
- Spend boldness here; keep everything else quiet.

## Local Server

- **Always serve on localhost** — never screenshot a `file:///` URL.
- Iterative work: `npm run dev` (Next.js dev server at `http://localhost:3000`).
- Final static-export verification: `npm run build` (runs the SEO-file prebuild step, then `next build` with `output: 'export'` into `out/`), then `node .claude/serve.mjs` to serve that `out/` directory at `http://localhost:3000` and screenshot **that**, not just the dev server — see Static Site Generation below.
- If a server is already running on port 3000, stop it (or kill the process holding the port) before starting another — `next build` will fail with an `EPERM` on `.next/trace` if the dev server still has the `.next` directory open.

## Screenshot Workflow

- Puppeteer is at `C:/Users/ataba/AppData/Local/Temp/puppeteer/`. Chrome cache at `C:/Users/ataba/.cache/puppeteer/`.
- **Screenshot from localhost:** `node .claude/screenshot.mjs http://localhost:3000`
- Saved to `.claude/temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten). Optional label: `... http://localhost:3000 label` → `screenshot-N-label.png`.
- After screenshotting, read the PNG with the Read tool and analyze it directly.
- Be specific when comparing: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px".
- Check: spacing/padding, font size/weight/width-axis/line-height, colours (exact hex), alignment, radius, the glass layer stack (is the shine inset actually visible? is the distortion filter applied?), gradient hover states, media sizing.
- **Verify the glass surfaces over real content** — screenshot mid-scroll, not at the top of the page, so the blur has something behind it to blur.
- **Screenshot every breakpoint × orientation combo before marking ANY visual change done — this is not optional and not satisfied by checking desktop alone.** The combos: mobile portrait (~375px) + landscape, tablet mini (~768px) + landscape, tablet midi (~834px) + landscape, tablet max (~1024px) + landscape, desktop (1280px+). `node .claude/screenshot-responsive.mjs http://localhost:3000 <page-label>` runs this exact 9-shot sweep (all 8 combos + desktop) against one URL in a single command and is the default way to do this — reach for it instead of manually screenshotting one breakpoint at a time unless you're isolating a single already-known issue. Read every resulting PNG; don't assume a fix that worked at one width works at the others.
- **Propagate every fix.** A bug found in one place is usually not local to that place — `GlassSurface`, `.gradient-hover`, the brand tokens, and anything else shared across components/sections/pages is used in many spots at once, so a bug in the shared pattern is a bug everywhere that pattern is used. When you fix one, grep for every other usage of that class/token/component and confirm (re-screenshot if the usage is visual) that the same fix is correctly in effect there too — don't leave sibling instances silently still broken just because nobody pointed at them yet. This applies across breakpoints as much as across components: a fix verified only at one width is not verified.

## Output Defaults

- Create `src/pages/index.jsx`, `src/pages/urunler/index.jsx` and `src/pages/urunler/[id].jsx` as Next.js pages (Pages Router). Add more pages/components as needed.
- Standard Next.js structure: default export, `Head` from `next/head` for meta/SEO.

### Static Site Generation

**The site is fully static.** Build with `output: 'export'` in `next.config.js` — the deliverable is a static bundle, so nothing may depend on a Node server at request time.

- **No `getServerSideProps`, no API routes, no server-only middleware, no ISR/`revalidate`.** Every page is generated at build time.
- Product data comes from a local source (mock JSON now, a real feed later) read in `getStaticProps` — never fetched from the client on first paint.
- `/urunler/[id]` uses `getStaticPaths` over every product id with `fallback: false`. A static export cannot render an unknown id on demand; if a product exists, it must be in the paths list at build time.
- **Filtering, sorting, search and pagination run entirely client-side** over the data baked into the page. This is compatible with the URL-param rule in L2 — read and write params with `router.replace(..., { shallow: true })` and hydrate state from `router.query`. Note that on a static export `router.query` is empty on the very first render, so read it inside an effect once `router.isReady` is true, and render an unfiltered-but-correct first paint rather than a flash of empty state.
- Generate `sitemap.xml`, `robots.txt` and `llms.txt` **at build time** from the same product/page source, as a prebuild script — not from a runtime route.
- `next/image` needs `images: { unoptimized: true }` under `output: 'export'`; keep explicit `width`/`height` on every image anyway so layout shift stays at zero, and compress assets yourself since the optimizer isn't running.
- The quiz, sliders, drag, language switcher and WhatsApp deep links are all client-side — that's fine, but they must not block the first paint, and the page must be readable and crawlable without them (this is what makes the GEO work above actually land).
- Verify the real output: `next build` then serve the exported directory and screenshot **that**, not just the dev server. A page that works under `next dev` and breaks in the export is a common failure here.
- The homepage no longer needs placeholder media — real hero video/images, category images, the ChemicalWorkz/polishing-banner images and both logos are supplied via `.claude/homepage_data/` and `.claude/logos/` (see **Homepage Content Source** above). Placeholders are still fine wherever `homepage_data` has no matching folder: `https://placehold.co/WIDTHxHEIGHT` for `/urunler` product imagery, a placeholder `.mp4` in `public/videos/` for anything outside the supplied hero slides, and a local mock JSON (ids, names, prices, categories, `isNew`, optional variants) for product data until a real feed is supplied.
- **Layout:** wide content container with narrow page-edge padding — content fills the screen. The header is the exception: it floats inset from every edge.
- **Responsive is non-negotiable.** Mobile-first. Every section, type size, image/video, and spacing must work correctly at every breakpoint × orientation combo below — no overlap, no overflow, no clipped text:
  - **Mobile** (~375px): portrait AND landscape.
  - **Tablet**, three sizes — **mini** (~768px, e.g. iPad mini), **midi** (~834px, e.g. iPad Air), **max** (~1024px, e.g. iPad Pro) — each tested in portrait AND landscape.
  - **Desktop** (1280px+).
  Verify this with `node .claude/screenshot-responsive.mjs http://localhost:3000 <label>` (see Screenshot Workflow) — don't eyeball responsiveness from CSS alone, actually screenshot every combo.
  Nav collapses to a menu on mobile/tablet (still glass, still floating); the filter panel becomes a full-screen modal; sliders stay drag-controllable with touch; media stays full-bleed and correctly cropped at every size/orientation. Landscape on small devices (short viewport height) is a common breakage point — check it explicitly, especially the floating header and the quiz pop-up.
- **Styling conventions:**
  - Page styles → `src/styles/pages/<pagename>.scss`, imported in the page.
  - Component styles → `src/styles/components/<ComponentName>.scss`, imported in the component.
  - New `.scss` per page/component as needed. **Never** inline styles or Tailwind classes in `.jsx`.
  - BEM or logical class names. Define the brand tokens above as SCSS/CSS variables in one place.
- Break the page into reusable components under `src/components/`: `GlassSurface`, `Header`, `Footer`, `HeroSlider`, `CategorySlider`, `AboutChemicalWorkz`, `PolishingBanner`, `QuizModal`, `ContactSection`, `WhatsAppFab`, `SearchBar`, `SortMenu`, `FilterPanel`, `ProductGrid`, `ProductCard`, `Pagination`, `EmptyState`, `ProductGallery`, `ProductInfo`, `VariantPicker`, `ProductPoster`, `LanguageSwitcher`.

## Anti-Generic Guardrails

- **Colours:** only the Vision Detail palette above. Never default Tailwind (indigo/blue/etc.). The gradient stays locked to hover text.
- **Glass, not grey boxes:** every glass surface uses the full four-layer stack. A `background: rgba(255,255,255,.25)` panel with no distortion, no shine inset and no content layer is a failed glass surface.
- **Shadows:** use the brand's own glass shadow (`0 6px 6px rgba(0,0,0,.1), 0 0 20px rgba(0,0,0,.05)`) — not flat `shadow-md` stacks. It is a light shadow; don't darken it to make the surface "pop".
- **Typography:** Archivo (headings) + Hanken Grotesk (body) only, at the specified weight/width axes.
- **Animations:** prefer `transform` and `opacity`; where the glass language needs more, transition named properties only. **Never `transition-all`.** Spring easing per the brand file. Respect `prefers-reduced-motion` — that includes pausing slider autoplay and dropping the distortion animation.
- **Interactive states:** every clickable element needs hover, focus-visible and active states. Focus rings must stay visible against glass — don't let `backdrop-filter` swallow them.
- **Images/video:** media carrying overlay text gets a gentle scrim so the text stays legible. Keep imagery premium and technical, in line with chemicalworkz.de.
- **Spacing:** intentional, consistent tokens — not random Tailwind steps.
- **Depth:** clear layering (page background → content → glass surfaces → floating header → modal), not everything on one z-plane. Only the modal outranks the header.

## Hard Rules

- Do not add sections, pages, features or content that aren't in `design_architecture.html`. No cart, no checkout, no account system.
- Do not put the gradient anywhere except hover text, and do not gradient-fill the logo.
- Do not build a second glass surface into the header besides the language switcher; nav items are plain text.
- Do not introduce anything that breaks the static export: no `getServerSideProps`, no API routes, no runtime server dependency.
- Do not stop after one screenshot pass.
- Do not use `transition-all`.
- Do not use default Tailwind blue/indigo.
- Do not use any font outside Archivo / Hanken Grotesk.
- Small brand-grounded refinements are allowed — do not invent enhancements, do not overdo it.
- **Target the highest possible Google Lighthouse score** (Performance, Accessibility, Best Practices, SEO) on every page. `backdrop-filter` and the SVG displacement filter are the main performance risk here: keep the number of simultaneously blurred surfaces small, promote them deliberately, and never animate the filter itself. Use `next/image`-equivalent sizing/lazy-loading, compress and lazy-load video, reserve space for media to avoid layout shift, minimize JS/CSS, and ensure semantic HTML + alt text + contrast (glass surfaces are the usual contrast failure — verify text on them against the actual blurred backdrop, not against a solid swatch).
  - **Actually run Lighthouse, don't estimate it.** `npx lighthouse http://localhost:3000 --output=json --output-path=<path> --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo --quiet` (Chrome resolves automatically once `puppeteer-core`/`lighthouse` are installed; pass `--chrome-path` only if it doesn't). **Run it against `npm run build` + `.claude/serve.mjs` (the static export), never the dev server** — dev builds are unminified/unoptimized and give meaningless scores. Parse `r.categories[cat].score` and `r.audits[id]` from the JSON rather than eyeballing the CLI table.
  - As of this writing the homepage scores **Performance 99, Accessibility 100, Best Practices 100, SEO 100** against the static export. Known techniques that got it there, worth reapplying/checking whenever you touch related code:
    - Fonts via `next/font/google` in `_app.jsx`, not a manual `<link>` in `_document.jsx` — Next's `Head` silently dedupes/strips repeated same-`href` `<link>` tags, which breaks any hand-rolled preload+swap trick (see Typography section above).
    - `<meta name="viewport" content="width=device-width, initial-scale=1">` set explicitly — Next's Pages Router default omits `initial-scale`.
    - Hero videos carry a real `poster` (extracted via `scripts/optimize-media.mjs`'s `videoPosterToWebp`) plus a `<link rel="preload" as="image" fetchPriority="high">` on the first slide's poster — the poster, not the video frame, is the LCP candidate for a `<video>` element, and preloading it is what keeps LCP low.
    - `.claude/serve.mjs` gzips text assets and sends real `Cache-Control` headers (immutable for hashed `_next/static/`, revalidate for HTML) — without this, a Lighthouse run against it will show false "no compression" / "no cache policy" failures that don't reflect a real static host (Vercel/Netlify/Cloudflare Pages/etc. all do this automatically).
    - All interactive touch targets need a real ≥24×24px hit area even when the visual affordance is smaller (e.g. the hero slider's dots are a small visible dot inside a larger invisible button) — this is WCAG 2.5.8 / Lighthouse's `target-size` audit, not covered by the 44×44px guidance elsewhere in this file being merely "recommended."
    - An `<img>` gets `alt=""` (not a repeated description) when the exact same text already sits next to it in the same link/card — otherwise screen readers announce the label twice (Lighthouse's `image-redundant-alt`).
  - Re-run the Lighthouse check after any change that touches fonts, hero media, meta tags, `_document.jsx`/`_app.jsx`, or `.claude/serve.mjs` — these are exactly the areas that moved the score last time, so they're the areas most likely to regress it.
