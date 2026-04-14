The Garten-Planer app is a specialized tool for managing garden beds and seed data, featuring a React-based frontend and an automated research workflow.

## Application Workflow
1.  **Seed Management:** Individual seeds are stored in `src/seeds/` as JSON files. These are dynamically aggregated by `src/data.ts`. Data includes `name`, `category` (Gemüse, Kräuter, Salat, Blumen), `origin` (e.g., Bingenheimer), `instructions`, and companion planting info.
2.  **Bed Planning:** Beds are configured in `beds_data.json` and persisted in `localStorage`. The UI allows real-time companion planting checks based on the seed data. Beds are automatically numbered from left to right (Beet 1, Beet 2, etc.) and can be dynamically reordered using the arrow controls.
3.  **Jungpflanzen-Support:** The system supports both seeds and young plants. For young plants (e.g., from Dehner), the calendar starts directly with the planting phase ("P"), skipping the "V" and "D" phases.
4.  **UI/UX:** The React frontend (Vite) provides a seasonal calendar, companion planting visualization, and a bed-specific image gallery for tracking progress. The layout is fully responsive and optimized for mobile (portrait mode) with sticky columns in the calendar table for easier navigation on small screens.
5.  **Calendar Logic:**
    - **V**: Voranzucht (Indoor/Greenhouse)
    - **D**: Direktsaat (Direct sowing in bed, no prior Voranzucht)
    - **P**: Pflanzung (Transplanting to bed after Voranzucht)
    - **E**: Ernte (Harvest)
5.  **Resources:** The UI provides direct access to the official Bingenheimer seed calendar and companion planting guides (`Mischkulturen.pdf`).
6.  **Automatic Research:** `watcher.js` identifies seeds with missing `instructions` and logs them to `pending_research.log`.
7.  **Agent Mandate:** Gemini CLI scans for "pending" seeds, performs research (via `gartentipp313.pdf` & web search), and updates the JSON files with `instructions`, `goodNeighbors`, `badNeighbors`, and `origin`. **If `origin` is specified, it MUST be included in the web search query for higher precision.** Otherwise, a general search is performed.

## Main Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Vite development server (UI) inside `garten-planer`. |
| `node watcher.js` | Start the seed watcher (background monitoring) inside `garten-planer`. |
| `npm run build` | Compile the TypeScript/React application for production inside `garten-planer`. |
| `npm run preview` | Preview the production build locally inside `garten-planer`. |
| `git push` | Push changes (including bed updates) to GitHub/Vercel. |

---
*Note: Always check `pending_research.log` inside `garten-planer` for seeds requiring data enrichment.*
