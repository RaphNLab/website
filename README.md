# RaphNLab website — source

A plain HTML/CSS/JS website for RaphNLab (no build step, no framework, no
external dependencies or CDNs — open `index.html` in a browser and it works).

## Structure

```
index.html          Home
about.html           About, mission, vision, timeline
services.html        For companies & institutions (embedded engineering services)
training.html        For individuals, teams & schools (courses, pricing, kids workshops)
realisations.html    Project portfolio (shown as "Projects" in the nav; the
                     file name is kept so existing links keep working)
contact.html         Adaptive contact form + direct contact details + FAQ

assets/
  css/style.css       All styling (design tokens at the top as CSS variables)
  js/main.js          Mobile nav, carousels, training sub-nav, contact form,
                      training reservation drawer
  js/i18n.js          Tiny language-switching engine
  i18n/translations.js  All page text, in English / French / German
  img/                Logo variants, favicon, and workshop photos
```

## How the language switcher works

There's no server and no build step, so translations live in one JS file:
`assets/i18n/translations.js`, structured as
`{ en: { page: { key: "text" } }, fr: {...}, de: {...} }`.

Every piece of translated text in the HTML has a `data-i18n="page.key"`
attribute. `assets/js/i18n.js` reads the visitor's saved/browser language,
finds every `[data-i18n]` element, and swaps in the matching string. Picking a
language in the nav bar dropdown calls the same function and remembers the choice for
next time (`localStorage`).

**To edit copy:** open `assets/i18n/translations.js`, find the key (e.g.
`home.hero_title`), and edit the string for each language you want to change.
You do not need to touch the HTML.

**To add a new translated element:** in the HTML, add
`data-i18n="page.new_key"` to the element, then add `new_key: "..."` under
that page in all three language blocks in `translations.js`. If the text
needs inline HTML (a link, bold text), also add the boolean attribute
`data-i18n-html` to the element.

## Editing content that isn't translated

Some things are intentionally hardcoded and identical across languages:
proper nouns (RaphNLab, university names), the email address, and prices.
These live directly in the HTML files — search for the text and edit it in
place, in all six HTML files if it appears in the header/footer.

## Header and footer are duplicated per page

There's no templating engine, so the `<header>` nav and `<footer>` blocks are
copy-pasted into all six HTML files. If you change a nav link or footer
column, you need to repeat the change in each file. This is a deliberate
trade-off for "just open the file and it works" simplicity — if the site
grows much further, moving to a static site generator (11ty, Astro, or even
a simple template loop) would remove this duplication.

## Contact form, topics and reservations

`contact.html` asks *why* the visitor is writing (Embedded project / Training /
University & partnership) and adapts the message label and placeholder.
Links elsewhere on the site pre-select the topic with a query string:
`contact.html?topic=project`, `?topic=training`, `?topic=partnership`
(optionally `&course=c1|c2|c3` to pre-fill the course name).

The training page's "Reserve a seat" buttons open a reservation drawer
instead of the generic contact page.

Both forms work in two modes (see `sendForm` in `assets/js/main.js`):

- **Default (no backend):** submitting opens the visitor's email app with the
  message pre-filled; the page says so honestly.
- **Real sending:** set `data-endpoint="https://formspree.io/f/xxxx"` (or any
  endpoint that accepts a form POST and returns JSON) on
  `<form id="contact-form">` in `contact.html` and on
  `<form id="reserve-form">` in `training.html`. Messages are then sent from
  the page and a confirmation is shown.

## Images

- `assets/img/mascot*.png` — the pangolin-circuit logo mark, cropped from the
  original artwork at `Media_&_Flyers/Logo/Logo/RaphNLab-01.png` (vector
  source also available there as `.ai`/`.eps`/`.pdf` for print use).
  `-white` variants are pre-recolored for use on dark backgrounds.
- `assets/img/favicon.png` — browser tab icon, generated from the mascot.
- `assets/img/photo-*.jpg` — real workshop photos, resized and compressed
  for the web (originals are several MB each; these are optimized to
  150–300KB). Used with confirmed parental consent for the photos showing
  children (Kid_Training workshop).

## Known TODOs / open decisions

- **Domain**: `raphnlab.de` (referenced in the founding vision document) is
  not currently registered/resolving. Register it before publishing, or pick
  a different domain and update the email address referenced throughout the
  site (currently `s.ngoufack@raphnlab.de`).
- **Address**: per your decision, the site shows only "Germany & Cameroon" —
  no street address, since the on-file address changed several times
  (Karlsruhe 2022 → Duisburg 2024 → possibly Aalen). Add a real address to
  `contact.html` and the footer of all pages if/when you want one listed.
- **LinkedIn / YouTube**: only Instagram is linked in the footer, since it's
  the only confirmed live, public profile found in your files. Add real URLs
  next to the Instagram link in all six footers when those channels are
  public.
- **Pricing**: course prices (279€ / 589€ / 789€) are pulled from your 2024
- **Course sessions**: courses show "Next cohort forming". Replace with real
  dates, format (remote / city), language and seats once sessions are planned
  (`training.next_forming` and the "Preferred session" options).
- **Partner logos**: "Trusted by" uses monogram placeholders. Drop real logo
  files into `assets/img/` and swap them into the `.logo-mark` blocks
  (home page marquee and Projects page).
- **Fire & gas statistic**: the "FCFA 1 trillion (2019)" figure in the case
  study (`realisations.cs_challenge`) needs a cited source, or should be removed.
- **Project visuals**: projects use diagrams/terminal mock-ups drawn in SVG
  (`.viz-*`). Replace with real prototype/hardware photos when available.
