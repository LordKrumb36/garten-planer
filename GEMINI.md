The Garten-Planer app is a specialized tool for managing garden beds and seed data, featuring a React-based frontend and an automated research workflow.

## Application Workflow
1.  **Seed Management:** Individual seeds are stored in `src/seeds/` as JSON files. These are dynamically aggregated by `src/data.ts`. Data includes `name`, `category` (Gemüse, Kräuter, Salat, Blumen), `origin` (e.g., Bingenheimer), `instructions`, and companion planting info.
2.  **Bed Planning:** Beds are configured in `beds_data.json` and persisted in `localStorage`. The UI allows real-time companion planting checks based on the seed data. Beds can be dynamically reordered using the left/right arrow controls on the bed headers.
3.  **UI/UX:** The React frontend (Vite) provides a seasonal calendar and companion planting visualization.
4.  **Calendar Logic:**
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
