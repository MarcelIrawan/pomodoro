# Pomodoro Focus Timer — Deployment & Runbook

## Overview
This document describes how to deploy the Pomodoro Focus Timer to Cloudflare Pages and perform related operations.

### Architecture Overview
- **Static Site**: Vite + Preact SPA built to `dist/`
- **Cloudflare Pages**: Static site hosting with custom `_headers` and `_routes.json`
- **CI/CD**: GitHub Actions → Cloudflare Pages deploy on push to `main`
- **Local Deploy**: `scripts/deploy-pages.sh` for manual deployment

## Deployment Steps

### 1. Prerequisites
- ✅ Cloudflare account with Pages project named `pomodoro` created
- ✅ `CLOUDFLARE_API_TOKEN` with Pages:Edit permissions (create via Cloudflare Dashboard → Profile → API Tokens)
- ✅ `CLOUDFLARE_ACCOUNT_ID` (found in Cloudflare Dashboard → Account Settings → API Tokens)
- ✅ Node.js 22+ and npm installed

### 2. Local Development & Build
```bash
# Install dependencies
npm ci

# Run lint (pre-existing formatting issues)
npm run lint

# Typecheck (strict TypeScript)
npm run typecheck

# Test (vitest)
npm run test

# Build (generates dist/)
npm run build
```

### 3. Manual Deployment
```bash
# Make script executable (if not already)
chmod +x scripts/deploy-pages.sh

# Deploy to main branch
./scripts/deploy-pages.sh

# Or specify project name and branch
CLOUDFLARE_API_TOKEN=... ./scripts/deploy-pages.sh --project-name pomodoro --branch main
```

### 4. CI/CD Pipeline
- **Trigger**: Push to `main` branch or PR merge
- **Steps**:
  1. Checkout code
  2. Setup Node.js 22
  3. Install dependencies (`npm ci`)
  4. Lint (`biome check .`)
  5. Typecheck (`tsc --noEmit`)
  6. Test (`vitest run`)
  7. Build (`vite build`)
  8. Deploy to Cloudflare Pages (on main branch only)

### 5. Post-Deploy Verification
- Visit your deployed site at: `https://<your-project-name>.pages.dev`
- Verify:
  - All routes work (SPA fallback)
  - Static assets load (CSS, JS, images, sounds)
  - Offline functionality (turn off network, reload)
  - Service worker updates (check devtools → Application → Service Workers)

### 5.1. CI/CD Status
- GitHub Actions runs on every push to `main`
- Check status at: `Actions` tab in GitHub repository
- Deployment logs show success/failure with Cloudflare API response

### 5.2. Rollback
- Cloudflare Pages keeps previous deployments
- In dashboard, select previous version and click "Publish"
- Or redeploy from Git with a new commit

### 5.3. Troubleshooting
| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 404 on routes | `_routes.json` missing or misconfigured | Rebuild → verify `dist/_routes.json` exists |
| Assets not loading | `_headers` or `_routes.json` exclude pattern too broad | Check `_routes.json` include/exclude lists |
| Service worker not updating | Browser caching | Clear cache or use incognito window |
| Build fails | Missing dependencies or syntax errors | Run `npm ci` → `npm run build` locally |

## Asset Manifest
The build generates the following key files in `dist/`:
- `index.html` (main entry point)
- `_headers` (HTTP response headers)
- `_routes.json` (Cloudflare Pages routing rules)
- `sw.js` (Service Worker)
- `workbox-9c191d2f.js` (Workbox runtime)
- `assets/` (versioned JS/CSS files)
- `icons/` (PWA icons)
- `sounds/` (audio files)
- `manifest.webmanifest` (PWA manifest)
- `offline.html` (fallback page)

## CI/CD Security
- Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are stored in GitHub repository secrets
- Never commit secrets to code or `.env` files
- Use GitHub's "Deployments" feature to track deployments

## Versioning
- Semantic versioning follows `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- Tags are used for releases: `git tag v1.0.0 && git push --tags`
- CI automatically deploys from `main` branch (not tagged commits)
- For major releases, create a new branch and merge to `main` after testing

## Notes
- The `_headers` file sets security headers for the root path
- The `_routes.json` file implements SPA fallback behavior
- All static assets are versioned with content hashes in filenames
- The build process uses Vite's production mode (minification, tree-shaking)