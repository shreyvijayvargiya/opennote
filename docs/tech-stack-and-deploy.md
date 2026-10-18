# Tech stack, storage and deploying

## Stack

| Layer | Package |
| --- | --- |
| Framework | Next.js 15 (pages router), React 18 |
| Tables | **@tanstack/react-table** (sorting, filtering, paging, selection) |
| Search | **fuse.js** (fuzzy search for the gallery, ⌘K and tables) |
| Storage | **Dexie** on IndexedDB (tables, chats, settings) |
| UI | Tailwind CSS 3, shadcn-style components on Radix UI, Hugeicons, lucide |
| Drag and drop | @dnd-kit (rows, columns, sidebar) |
| Dates | react-day-picker + date-fns |
| Code highlight | highlight.js |
| Import / export | papaparse (CSV), SheetJS `xlsx` (Excel), jspdf + jspdf-autotable (PDF) |
| Shortcuts | react-hotkeys-hook |
| AI | OpenRouter (streaming + tool calls) |

## How a table is stored

A table is one record in IndexedDB:

```json
{
  "id": 7,
  "title": "WhatsApp Leads",
  "parentId": 2,
  "icon": "emoji:🎯",
  "content": "{\"v\":1,\"columns\":[...],\"rows\":[...]}"
}
```

`content` holds the columns (`id`, `name`, `type`, optional chip `options`) and the rows (`cells` keyed by column id). Saves are debounced by 500 ms.

## Run it locally

```bash
git clone https://github.com/shreyvijayvargiya/rowtabs.git
cd rowtabs
npm install
npm run dev     # http://localhost:3000
```

## Deploy to Vercel

RowTabs is a static-friendly Next.js app, so the free plan is enough.

1. Push the repo to GitHub.
2. In Vercel choose **Add New → Project** and import the repo.
3. Keep the defaults (Framework: Next.js, build command `next build`). No environment variables are required.
4. Click **Deploy**.

You can also use the CLI: `npm i -g vercel && vercel --prod`.

## Adding a database (optional)

RowTabs is local-first on purpose, but you can sync tables to a server. The simplest path:

1. Use **Code → SQL** on a table to get a `CREATE TABLE` and `INSERT` script, and run it in Postgres, Supabase or Neon.
2. For live sync, add a thin API route (for example `pages/api/tables.js`) that stores each table's `content` JSON, and call it from `lib/tables/tableService.js` after every save.
3. Keep IndexedDB as the offline cache and sync when online.

## Contributing

- `lib/tables/` holds the data model, gallery templates, import/export and the AI operations.
- `lib/components/tables/` holds the editor, cells, gallery, import and ⌘K UI.
- To add a gallery table, add one line to `lib/tables/gallery.js`.
- To add a theme, run `node scripts/add-theme.mjs` (see the README).

Pull requests are welcome.
