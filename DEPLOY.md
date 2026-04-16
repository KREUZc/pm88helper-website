# Deploy (Cloudflare Pages)

This site is 100% static.

## Option A — Deploy `site/` directly

1. Create a new Cloudflare Pages project
2. Connect your Git repo
3. **Root directory**: `site`
4. **Build command**: (none)
5. **Output directory**: `/`

## Local preview

```bash
cd site
python3 -m http.server 8080
```

## Config (no-build)

- AI links (CTA): `data/ai.json`
- Checklist data: `data/checklist.json`
- Subsidy data (central + 22 cities): `data/subsidy.json`
- Vaccine timeline + sources: `data/vaccine.json`

## Rebuild deploy zip (optional)

If you use the prepared zip workflow, regenerate it after edits:

```bash
cd ../
zip -r mesh/artifacts/builds/pm88helper-site-cloudflare-pages.zip site \
  -x '*.DS_Store' -x '*Icon*'
```
