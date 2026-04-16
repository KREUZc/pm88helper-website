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
