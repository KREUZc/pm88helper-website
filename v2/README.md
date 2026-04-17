# pm88helper-website (static)

This folder is a **100% static site** bundle (no build step) for Cloudflare Pages.

## Local preview

```bash
python3 -m http.server 8080
```

Then open: http://127.0.0.1:8080

## Quick config checklist

1) AI links (CTA)
- Edit: `data/ai.json`
- Default: links point to official entry pages (Gemini / ChatGPT)
- If you have your own Gem / GPTs published URLs: replace `links[].url`

2) Vaccine official sources
- Edit: `data/vaccine.json`
- UI renders `sources` only when `sources[].url` is present
- Current default sources are **official site search pages** (safe fallback). You can later replace them with exact CDC/HPA page URLs.

3) Subsidy data
- Data lives in `data/subsidy.json` (includes central + 22 cities)

## Key files
- `index.html`
- `styles/main.css`
- `scripts/checklist.js`
- `scripts/data.js` (subsidy + vaccine rendering)
- `scripts/ai.js` (AI CTA rendering)

## Notes
- All sections show an `更新：YYYY-MM-DD` line based on the JSON's `updated` field.

## Hermes Approach (2026-04-16)

This homepage now follows a Hermes-style "15-second onboarding" flow:

1. User picks:
- stage from `data/checklist.json` (`stages`)
- city from `data/subsidy.json` (`locals`)
2. User clicks `生成我的本週待辦`
3. UI renders:
- `本週 3 件事`: first 3 items from the selected stage
- `補助速查`: selected city summary + city official URL + one central source
- `疫苗速查`: next 2 timeline ages + source links (with placeholder fallback)

### Persistence
- Uses one localStorage key: `pm88-hermes-onboarding-v1`
- Persists:
- selected `stageId`
- selected `cityName`
- checklist checked map (`checks`) keyed by `stageId::itemId`

### Accessibility updates
- Skip link targets `#main-content`, and `<main>` is focusable with `tabindex=\"-1\"`
- Form has explicit help text via `aria-describedby`
- Improved visible focus states for controls and checklist rows
- Maintained heading hierarchy (`h1` → `h2` → `h3`)

### GitHub Pages subpath safety
- JSON fetch uses relative paths (`data/*.json`) through `new URL(path, document.baseURI)`
- No leading-slash fetch paths are used in the onboarding script

### Updated files
- `index.html`
- `styles/main.css`
- `scripts/app.js`
