# SocketMonnie — Frontend

React 19 + Vite 8 single-page application (member, admin, finance and support areas) using `createBrowserRouter` (client-side routing).

## Deployment (Render — Static Site)

The app uses **client-side routing** (`createBrowserRouter` in `src/routes/index.jsx`). That means the host must serve `index.html` for every unknown path; otherwise opening or refreshing a nested route (e.g. `/dashboard/savings`, `/admin`, `/dashboard/transactions/abc`) returns a 404 even though in-app navigation works.

**Required Render configuration** — Render Dashboard → *your Static Site* → **Settings → Redirects and rewrites**:

| Action   | Source | Destination |
| -------- | ------ | ----------- |
| Rewrite  | `/*`    | `/index.html` |

Notes:

- Render serves real files first and only applies the rewrite when no file matches the path, so static assets (`/assets/*`, `/manifest.json`, `/sw.js`, …) are unaffected.
- The backend API is a **separate service**, so this rewrite never shadows API traffic.
- The app intentionally ships **no** `public/_redirects` file: that format is Netlify-specific and Render ignores it. It was removed when the deployment moved from Netlify to Render — a leftover file can mask a missing dashboard rule.
- If the site is ever moved back to Netlify, add the equivalent rewrite there (`/*  /index.html  200` in `public/_redirects`).
- Build command: `npm install && npm run build`
- Publish directory: `./dist`
- Build-time env var: `VITE_API_BASE_URL=https://socketmonie.onrender.com/api`

## Local development

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production bundle into dist/
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, follow the [installation instructions](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for more information.
