# Getting started with RowTabs

RowTabs is a **free, open-source, local-first table app**. Think Airtable or a Notion database, but everything lives in **your browser** (IndexedDB). No account, no server, no tracking, and it keeps working offline.

> Source code: [github.com/shreyvijayvargiya/rowtabs](https://github.com/shreyvijayvargiya/rowtabs) · MIT licensed

## Your first table in 30 seconds

1. Click **Gallery** (the grid icon next to the tabs) or press **⌘K** and type what you need, for example `whatsapp leads`.
2. Pick one of the **100 ready-made tables**. It opens with the right columns and a few sample rows.
3. Click any cell to edit it. Click a header to sort. Drag the grip next to a header or a row to reorder.
4. Everything is saved automatically, a moment after you stop typing.

Prefer your own data? Use **Import** to turn a CSV, Excel, JSON, Markdown or HTML table into a RowTabs table. Column types (numbers, dates, links, chips…) are detected for you.

## The layout

| Area | What it does |
| --- | --- |
| **Sidebar** | All your tables in a tree. Tables can sit inside other tables or folders. Drag a table onto another to nest it. Click the icon of a table to change it (icons and emoji). |
| **Tabs** | Every open table is a tab. Middle-click closes a tab. |
| **Split view** | Open a second table beside the first (up to two). Drag the divider to resize. |
| **AI assistant** | Press **⌘L**. It can read, create and edit tables for you. See *AI and MCP*. |
| **⌘K search** | Jump to a table, add a gallery example, toggle the theme or open settings. |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| **⌘/Ctrl + K** | Search tables, gallery and actions |
| **⌘/Ctrl + L** | Open the AI assistant and focus its input |
| **⌘/Ctrl + B** | Show or hide the sidebar |
| **Enter** | Save the cell you are editing |
| **Esc** | Close a popover |

## Limits (everything is in your browser)

| Limit | Value |
| --- | --- |
| Tables per browser | 200 |
| Rows per table | 2,000 |
| Columns per table | 40 |
| One attached file or image | 2 MB |
| Size of one table | about 20 MB |

These caps keep the app fast. Export a table (CSV, JSON, SQL…) at any time and move bigger data to a real database. See *Tech stack and deploy*.

## Exporting your data

Open a table and use the buttons at the top right:

- **Copy** puts the table on your clipboard as a Markdown table (paste into Notion, GitHub, Slack…).
- **Download** saves a **PDF, CSV, HTML, Markdown, JSON or SQL** file.
- **Code** shows the table as **SQL, React, JSON, Markdown, HTML or CSV** so you can copy it into your project.

## Where is my data?

In your browser's IndexedDB database (`RowTabsDB`). Clearing site data deletes it, so export what matters. Nothing is ever sent to a server, except the messages you send to the AI model you choose.
