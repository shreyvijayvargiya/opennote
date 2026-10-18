# I Built a Free, Open-Source Airtable Alternative That Lives in Your Browser (And Gave Away 100 Ready-Made Tables)

*No account. No server. No row limits that hold your own data hostage. Just tables, stored on your device, with an AI assistant that can build them for you.*

**By Shrey Vijayvargiya** · 8 min read

---

Last month I opened a new Airtable base to track leads for a side project. Twenty minutes later I had not tracked a single lead.

I had named the base. I had argued with myself about whether "Status" should be a single select or a linked record. I had built four columns, deleted two, and gone looking for a template that looked roughly like what I wanted. Somewhere in there I realised the real problem: **I did not need a platform. I needed a table, and I needed it to already have the right columns.**

So I built one. It is called **RowTabs**, it is free and open source, and everything you create stays in your browser.

> **Get the code:** [github.com/shreyvijayvargiya/rowtabs](https://github.com/shreyvijayvargiya/rowtabs)
> **Free download at the end of this article:** the full catalog of all 100 table templates (Markdown and CSV).

---

## What RowTabs actually is

RowTabs is a table app in the spirit of Airtable and Notion databases. Open it and you get:

- a sidebar with all your tables (tables can live inside other tables)
- tabs for every table you have open, plus a split view to put two side by side
- an editor where **every cell is editable by default**, with sorting, searching and filtering built in
- an AI assistant on the right that can read, create and edit your tables
- a gallery of **100 ready-made tables** so you never start from a blank grid

The whole thing runs in the browser. Your tables are saved in IndexedDB, the database that is already built into every modern browser. That has some quiet but important consequences:

1. **It is private.** There is no server to send your data to, so nothing is sent.
2. **It is fast.** There is no network round trip when you edit a cell.
3. **It works offline.** On a plane, in a tunnel, on bad café Wi-Fi.
4. **It is free to run.** No database bill, because there is no database to host.

The trade-off is honest and I will not hide it: your data lives on one device and one browser. RowTabs ships with export for exactly that reason, and I will get to that.

---

## The part I am most proud of: the gallery

The fastest way to get value from a table app is to not build the table.

The RowTabs gallery has **100 tables across 12 categories**:

| Category | Examples |
| --- | --- |
| **CRM** | Contacts CRM, Deals Tracker, Customer Support Tickets, Renewals Calendar |
| **Leads** | WhatsApp Leads, Instagram DM Leads, LinkedIn Outreach, Local Business Leads |
| **Pipelines** | Sales Pipeline, Recruiting Pipeline, Investor Fundraising Pipeline |
| **Digital Products** | Course Sales Tracker, Template Store Inventory, License Keys, Affiliate Tracker |
| **E-commerce** | Product Inventory, Orders, Returns & Refunds, Discount Codes, Abandoned Carts |
| **Marketing** | Campaign Planner, SEO Keyword Tracker, Influencer Outreach, Backlink Tracker |
| **Projects** | Project Tracker, Sprint Backlog, Bug Tracker, OKRs, Risk Register |
| **HR & Hiring** | Candidate Tracker, Employee Directory, Leave Tracker, Job Openings |
| **Finance** | Expense Tracker, Invoice Tracker, Subscriptions Tracker, Savings Goals |
| **Content** | Blog Editorial Calendar, YouTube Video Planner, Code Snippets Library |
| **Education** | Course Curriculum, Student Gradebook, Reading List, Study Planner |
| **Personal** | Habit Tracker, Workout Log, Meal Planner, Travel Itinerary |

Each card shows a live preview, the columns, and what the table is for. Click **Add table** and it opens with real columns *and* a few sample rows, so you can see how it is meant to be used before you replace the data with your own.

### Search that forgives you

I did not want a gallery you have to browse like a catalog. You should be able to type what is in your head.

The search uses **Fuse.js**, a lightweight fuzzy-search library, and I added one trick: every meaningful word in your query is searched on its own and the scores are added together. So templates that match *more* of your words rise to the top.

Type this:

```
table for leads whatsapp
```

and **WhatsApp Leads** is the first result. "table", "for" and other filler words are ignored, "leads" and "whatsapp" each vote, and the template that matches both wins. Typos work too: `whatsap leads` still finds it, and `invoce` finds **Invoice Tracker**.

You can open the gallery from the grid icon next to the tabs, or press **⌘K** and just start typing.

---

## Sixteen column types, because a table is not a spreadsheet

The thing that makes Airtable-style tools feel different from a spreadsheet is that a cell knows what it holds. RowTabs has 16 column types:

- **Text** with bold, italic and links
- **Number**, **Checkbox**, **Rating** (stars), **Slider**
- **Date**, with a proper calendar picker
- **Chips**: colored labels you can rename and recolor from a palette, right inside the cell
- **Link**, **Phone** (with a country code), **OTP / PIN**
- **Files** and **Image**, stored right in the browser (2 MB each, a cap that keeps the app fast)
- **Avatar** (cartoon avatars) and **Icon** (the same icon and emoji picker as the sidebar)
- **Code**, with a language dropdown and syntax highlighting
- **Table link**, which points at *another table* in your app

That last one is how tables go **inside tables**. Create a "Companies" table, add a "Contacts" column of type *Table link*, and every company can point at its own contacts table. Click the chip and you jump straight in. You can also nest tables in the sidebar by dragging one onto another.

Change your mind about a column? Change its type from the header menu. RowTabs converts the values as it goes. Turn a messy text column into **Chips** and each distinct value becomes its own colored label, automatically.

---

## Editing should feel obvious

A few small decisions that I think matter more than any feature:

- **Click a header to sort.** Ascending, descending, none. Number columns sort as numbers, dates as dates, chips by their label.
- **One search box** looks through every column.
- **Stackable filters**: *Status is Qualified* and *Value > 1000*. Each rule adapts to the column type.
- **Drag to reorder** rows and columns. Resize a column by dragging its edge.
- **Select all** with the header checkbox, then **Delete**, or send just those rows to the AI.
- **Delete a row** and you get an *Undo* toast. Deleting a whole table always asks first.

Under the hood the sorting, filtering, paging and row selection run on **TanStack Table**, the headless table library. I wanted something battle-tested for the logic, and total control over how it looks.

---

## Bring your own data

You probably have data somewhere already. RowTabs imports **CSV, TSV, Excel, JSON, Markdown and HTML tables**. Drop the file in and you get a preview before anything is created. Column types are detected: numbers become Number columns, dates become Date columns, a column with only a few repeated values becomes Chips, URLs become Links.

And you can get everything back out:

- **Copy** a table as a Markdown table to paste into Notion, GitHub or Slack
- **Download** as **PDF, CSV, HTML, Markdown, JSON or SQL**
- **View as code**: the same table as a SQL `CREATE TABLE` plus `INSERT`s, a React component, or JSON, ready to copy into your project

That SQL export is my favourite escape hatch. Prototype a data model in RowTabs, then paste it into Postgres.

---

## The AI assistant that edits tables, not just talks about them

Press **⌘L** and a chat panel opens. Add your own [OpenRouter](https://openrouter.ai) key (it stays in your browser), pick any model, and talk to your tables:

> *"Add a deal for Dunder Mifflin worth 5000 and mark it Negotiation."*

The assistant calls real tools: `read_table`, `create_table`, `add_rows`, `update_cells`, `add_column`, `delete_rows` and more. The edit lands in your table straight away, and the chat shows **Keep** and **Undo**. Undo restores the exact table from before the change.

A few details I care about:

- It reads the **live editor**, not the last saved copy, so a reply is always based on exactly what you see.
- **Deleting a table always asks for confirmation.** The assistant cannot delete anything on its own.
- Type **@** to tag a table as context. Select rows and click **Ask AI** to send only those rows.
- You can say *"create a WhatsApp leads table"* and it starts from the gallery template.

RowTabs also ships an **MCP** bridge, so Claude Desktop and other agents can list and read your tables.

---

## How I built it (for the curious)

RowTabs started life as **OpenNote**, my local-first notes app, and I reused its shell: the sidebar tree, tabs, split view, drag and drop, themes and the AI chat. The big change was swapping the rich-text editor for a table editor.

The stack:

- **Next.js 15** and **React 18**
- **TanStack Table** for the table logic and **Fuse.js** for fuzzy search
- **Dexie** on **IndexedDB** for storage
- **Tailwind CSS** with shadcn-style components on Radix UI
- **@dnd-kit** for drag and drop
- **papaparse**, **SheetJS** and **jsPDF** for import and export

A table is just one record: a title, an optional parent, and a JSON blob of columns and rows. That is why nesting, tabs and the AI tools were cheap to build. Everything is a record in one tree.

Because everything lives in the browser, I set honest limits instead of pretending: **200 tables, 2,000 rows and 40 columns per table**. They keep the app instant. When you outgrow them, export to SQL or CSV and move to a real database. The docs inside the app (**Getting started** in the sidebar) even show how to deploy to Vercel and add a database later.

---

## Try it in two minutes

```bash
git clone https://github.com/shreyvijayvargiya/rowtabs.git
cd rowtabs
npm install
npm run dev
```

Open `localhost:3000`, press **⌘K**, and type the kind of table you need.

It also has **10 color themes** in light and dark (import any theme from tweakcn), a **⌘K** command menu, and a built-in docs page rendered from Markdown.

---

## Free download: the 100-table catalog

If you only take one thing from this article, take this. I put every template into a catalog: the name, what it is for, and its columns. Use it as a checklist for your own data model, or as inspiration for what to track.

- **Markdown:** [`marketing/rowtabs-100-table-templates.md`](https://github.com/shreyvijayvargiya/rowtabs/blob/main/marketing/rowtabs-100-table-templates.md)
- **CSV** (import it into RowTabs itself): [`marketing/rowtabs-100-table-templates.csv`](https://github.com/shreyvijayvargiya/rowtabs/blob/main/marketing/rowtabs-100-table-templates.csv)

Here is a taste:

| Table | Columns |
| --- | --- |
| **WhatsApp Leads** | Name, WhatsApp number, Source, Status, Last message, Follow-up, Hot |
| **Local Business Leads** | Business, Category, City, Phone, Status, Notes |
| **Sales Pipeline** | Deal, Company, Value, Stage, Probability, Close date, Owner |
| **Digital Product Catalog** | Product, Type, Price, Status, Sales, Page, Cover |
| **Invoice Tracker** | Invoice, Client, Amount, Issued, Due, Status, Link |
| **Habit Tracker** | Habit, Mon–Fri checkboxes, Streak |

---

## What I would love from you

RowTabs is MIT licensed and I am building it in the open.

1. **Star the repo** if this is useful: [github.com/shreyvijayvargiya/rowtabs](https://github.com/shreyvijayvargiya/rowtabs)
2. **Tell me which template is missing.** Adding one is a single line in `lib/tables/gallery.js`, and I will merge good ones.
3. **Break it.** Import your messiest CSV and tell me what happens.

If you build something with it, I would love to see it.

— Shrey

---

*Tags: open source, airtable alternative, local first, productivity, no code, nextjs, tanstack, indiehackers*
