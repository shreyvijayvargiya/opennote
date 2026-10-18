<div align="center">

# RowTabs

**The free, open-source, local-first Airtable alternative.**
Editable tables with 100 ready-made templates, an AI assistant and MCP. Everything lives in your browser.

[Live docs in the app](#documentation) · [Gallery](#the-gallery-100-tables) · [Run it](#getting-started) · [Deploy](#deploy-to-vercel)

</div>

RowTabs is a table app in the spirit of Airtable and Notion databases. Every table is editable by default, with sorting, searching and filtering, and tables can live inside other tables. There is **no backend and no database to run**: tables are stored in your browser's IndexedDB, so it is fast, private and works offline.

It started as [OpenNote](https://github.com/shreyvijayvargiya/opennote) (a local-first notes app) and reuses its shell: sidebar tree, tabs, split view, AI chat, themes and MCP. The Tiptap editor is replaced by a TanStack Table based editor.

## Features

- **Tables, not documents**: a Notion-style table editor built on **TanStack Table** with click-to-sort headers, global search, stackable filters, paging, row selection and *select all*.
- **16 column types**: text (bold / italic / link), number, checkbox, date (shadcn Calendar), **chips** (colored, rename and recolor them), link, **table link**, phone, slider, OTP, files, rating, avatar, icon, **code** (language dropdown with syntax highlighting) and image.
- **Nested tables**: drag a table onto another in the sidebar, or add a *Table link* column that points to any table (with search), or create a linked table from the cell.
- **Drag and drop**: reorder rows, columns and sidebar tables.
- **The gallery**: 100 tables across 12 categories (CRM, Leads, Pipelines, Digital Products, E-commerce, Marketing, Projects, HR, Finance, Content, Education, Personal) with previews, search and a category dropdown. Search uses **Fuse.js** and understands loose phrases: `table for leads whatsapp` finds *WhatsApp Leads*.
- **Import**: CSV, TSV, Excel, JSON, Markdown or HTML tables, with column types detected for you.
- **Export**: copy as Markdown, download **PDF, CSV, HTML, Markdown, JSON or SQL**, or open **View as code** for SQL, React, JSON, Markdown, HTML and CSV.
- **Tabs + split view**: every open table is a tab, up to two groups side by side with a resizable divider.
- **AI assistant** (right panel, ⌘L): bring your own [OpenRouter](https://openrouter.ai) key, tag tables with `@`, attach images, PDFs and CSVs. It can read, create, add rows to, edit and delete tables. Every change has **Keep / Undo** and deleting a table always asks first.
- **⌘K command menu**: your tables, gallery examples, AI assistant, theme toggle, docs and MCP config.
- **Getting started page**: documentation rendered from Markdown (`/docs`) inside the app.
- **10 color themes** (light and dark), compatible with [tweakcn](https://tweakcn.com).
- **MCP** (Claude Desktop and other agents) and WebMCP tools for tables.

## Getting started

```bash
git clone https://github.com/shreyvijayvargiya/rowtabs.git
cd rowtabs
npm install
npm run dev        # http://localhost:3000
```

Requires Node.js 18+. The AI assistant needs an OpenRouter key (optional): paste it in the chat panel, it stays in your browser.

## The gallery (100 tables)

Click the grid icon next to the tabs (or press ⌘K). Pick a table and it opens with real columns and sample rows, ready to edit. To add a template, add one line to `lib/tables/gallery.js`:

```js
t("Leads", "WhatsApp Leads", "Leads that reach you on WhatsApp…", "whatsapp leads chat phone",
  "Name; WhatsApp number|phone; Status|chips:New,Replied,Qualified,Lost; Follow-up|date", "Rahul Verma, Priya Nair");
```

## Limits

Everything is in the browser, so there are sensible caps (see `LIMITS` in `lib/tables/schema.js`):

| Limit | Value |
| --- | --- |
| Tables per browser | 200 |
| Rows per table | 2,000 |
| Columns per table | 40 |
| One file or image in a cell | 2 MB |
| One table | about 20 MB |
| Import file | 15 MB |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| ⌘/Ctrl + K | Command menu |
| ⌘/Ctrl + L | Open the AI assistant |
| ⌘/Ctrl + B | Toggle the sidebar |

## Tech stack

Next.js 15 · React 18 · **@tanstack/react-table** · **fuse.js** · Dexie (IndexedDB) · Tailwind CSS · shadcn-style Radix components · Hugeicons · @dnd-kit · react-day-picker · highlight.js · papaparse · SheetJS · jspdf · react-hotkeys-hook · OpenRouter · MCP SDK.

## Project structure

```
pages/            index (app), map (table graph), api/ (MCP endpoints)
lib/tables/       data model, gallery (100 templates), import, export, filters, AI table operations
lib/components/   sidebar, tabs, themes page, chat panel
lib/components/tables/   TableEditor, cells (16 types), gallery, import, ⌘K, docs page
lib/ai/           chat hook, OpenRouter client, tools the assistant can call
docs/             Markdown rendered on the Getting started page
mcp-server/       MCP bridge for Claude Desktop
scripts/          add-theme.mjs (tweakcn themes)
```

## Documentation

The docs live in [`docs/`](docs) and are rendered inside the app (sidebar → **Getting started**): getting started, tables and columns, AI and MCP, tech stack and deploying.

## Deploy to Vercel

RowTabs needs no environment variables and no database.

1. Push the repo to GitHub.
2. In Vercel choose **Add New → Project** and import it.
3. Keep the defaults and click **Deploy**.

CLI: `npm i -g vercel && vercel --prod`. To sync tables to a server later, see *Adding a database* in the docs.

## MCP

Open **Config** in the sidebar (or ⌘K → *MCP config*), generate a key and copy the Claude Desktop config. Variables: `ROWTABS_API_KEY`, `ROWTABS_URL`.

## Color themes

Click the palette icon in the sidebar header to open the Themes page: 10 live-preview cards (each has light and dark); click one to apply it. The choice is saved in `localStorage` (`rowtabs-theme`).

Add a theme from [tweakcn](https://tweakcn.com): copy its CSS (`:root` / `.dark` blocks) into a file, or use its registry JSON, then:

```bash
node scripts/add-theme.mjs --id my-theme --name "My Theme" theme.css   # or pipe via stdin
node scripts/add-theme.mjs --id my-theme --url https://tweakcn.com/r/themes/<id>.json
node scripts/add-theme.mjs --rebuild                                    # regenerate styles/themes.css
```

Colors are precomputed to RGB channels, so no `color-mix` / `oklch` browser support is needed.

## Contributing

Pull requests are welcome. Run `npm run dev`, change something, open a PR.

## License

MIT
