# Planner

Personal, mobile-first 7-day flexible eating planner and meal log, built from the Planner design handover.
No build step, no server, no accounts. Data stays in the browser.

## Run it

Double-click `index.html`, or serve the folder with any static server:

```
python -m http.server 8765
```

then open http://127.0.0.1:8765/index.html. Fonts load from Google Fonts, so the first visit needs a connection.

## Structure

| Path | What |
|---|---|
| `index.html` | Page shell: header, five page containers, tab bar, toast |
| `css/tokens.css` | Design tokens as CSS variables (light, dark, `data-theme` override). Mirrors the design system |
| `css/styles.css` | Layout and components |
| `data/library.js` | Food library, eating-out cards, avoid list, fruit and snack lists. Data only, no logic |
| `js/app.js` | State, recipe generation, rules, rendering, storage, backup |

## Editing the food library

Open `data/library.js`. Each item is `F(id, name, group, source, flags)`.

- `source` is `'p'` (原文, nutritionist PDF) or `'r'` (建議, pending nutritionist review).
- To remove an item the nutritionist rejects, delete its `F(...)` call. Nothing else changes.
- Flags: `c` recipe class, `v` vegetarian protein, `bf` allowed at breakfast, `only` breakfast-only,
  `deep` deep-sea fish, `second` 次選 red meat, `lc` low-carb allowed, `warn` advisory text,
  `rice` rice-type starch, `m` starch cook minutes, `por` portion text.
- Users can also switch items off in 設定 without touching code. Noodles (`noodle`) are off by default.

## Storage

- `localStorage` key `planner.v2` holds days, measurements, `本月多吃` list and switched-off foods.
- Photos live in IndexedDB `planner-photos`, store `p`, as JPEG data URLs (max 640px, quality 0.7).
- Backup is `{app:"planner", v:2, db, photos}`. 設定 offers a real `.json` download, copyable text, and import by file or paste.
- Storage is per origin. A new URL starts empty, so export before moving the site.

## Spec addendum: A5a Quick log (not in spec v2)

The log card at the bottom of 今日 is always a full form.

- If a recipe was staged with `呢款得`, the form is for that meal.
- Otherwise it has meal chips (早餐, 午餐, 晚餐, 小食, 其他; default by time of day), a free-text `食咗乜`, and the same photo, feel and note fields.
- Photo upload is visible straight away and optional. Saving needs a name or a photo, otherwise a toast shows.
- A meal logged this way can sit on an untyped day; the dot still fills.

## Changes from the reference prototype

- Split into `index.html`, `css/`, `data/`, `js/` with no logic change.
- Added a real `.json` backup download.
- Touch targets raised to 44px for small chips, choices and section headers.

## Phase 1 status

Done: project structure, data separated from logic, all five pages ported, backup download, accessibility pass on touch targets.
Verified in a browser: fresh load, type tagging, Low Carb rule over 1,500 random draws (no starch, no sweet potato or corn at breakfast), Plan dinner always has starch, stage and save a meal, quick log, calendar navigation, weight and waist chart, backup export and import round trip, 360px width with no horizontal scroll, dark theme.

Not yet done (Phase 2 candidates):

- Photo upload and the `.json` file download in a real phone browser (tested only on desktop emulation).
- Print stylesheet test with `window.print()`.
- PWA manifest and offline caching; self-hosted fonts.
- Back-filling older days (calendar dates open the day detail but logging is on 今日, current week only).
- The `[PDF]/[建議]` marker is shown in 設定 only, not on recipe cards.
- Seven-column grids (week board, calendar) are 37px wide at 360px; heights are 54 to 88px. Fitting 44px wide would need fewer columns or smaller gutters.

## Open questions for the nutritionist

1. Noodles versus gluten avoidance (PDF contradicts itself); default is rice-based products.
2. Low Carb breakfast: is example 3 (sweet potato, corn) allowed? Currently excluded.
3. Rest Day: no rules in the PDF; currently the eating-out formula.
4. All `建議` items need a batch review, especially tempeh, natto, chestnut and the soy sauce substitute.
5. No kcal target in the PDF, and none shown.
6. Supplement dosage is text only on 守則, with the disclaimer 只作文字參考，劑量以醫生同營養師為準。

## Hosting on GitHub Pages

1. Create a **public** repository (free Pages needs public). Upload the contents of this folder so `index.html` sits at the repo root.
2. Settings, Pages, Source: Deploy from a branch, `main`, `/ (root)`. The site appears at `https://<user>.github.io/<repo>/`.
3. To update, upload changed files to the repo. Export a backup first if the URL changes: storage is per origin.

## Search engines and privacy

- `index.html` carries `noindex, nofollow, noarchive`, which is what keeps the page out of search results.
- `robots.txt` only takes effect at the root of a host. On `<user>.github.io/<repo>/` it is ignored by crawlers, so the meta tag does the work there.
- The password gate (`js/gate.js`) is a screen lock, not security: the check runs in the browser. Records stay on the device.
- A public repository exposes all source, including the salted digest of the password.
