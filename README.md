Rede Peças Admin
Admin dashboard for the Rede Peças auto-parts ordering system. Next.js (App Router) + TypeScript + Tailwind CSS.

Getting Started
npm install
npm run dev       # http://localhost:3000 — the backend must be running on :3000 (see .env.local)
npm run build
npm run start
npm run lint
Set BACKEND_API_URL in .env.local to point at the backend API (defaults to http://localhost:3000/v1). The app runs on port 3000 in dev to avoid colliding with the backend on 3000.
