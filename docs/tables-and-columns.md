# Tables, columns and cells

Every cell has a **type**. Change a column's type from the `…` menu in its header. RowTabs converts the values as well as it can (for example, a text column turns into **Chips** with one chip per distinct value).

## The 16 column types

| Type | What you get |
| --- | --- |
| **Text** | Plain text with **bold**, *italic* and a link. Click the cell, use the small toolbar, press Enter to save. |
| **Number** | Numbers, prices and counts. Sorts numerically. |
| **Checkbox** | Done or not done. |
| **Date** | A calendar picker (shadcn Calendar) with *Today* and *Clear*. |
| **Chips** | Colored labels. Open the cell, click the pencil on a chip to rename it, pick one of 10 colors or delete it. Type a new name to create a chip. |
| **Link** | A clickable URL that shows the domain. |
| **Table link** | Link to another table in your app, with search. Choose *New linked table* to create a table inside this one. Click the chip to open it. |
| **Phone** | Country code dropdown plus the number. Click-to-call link. |
| **Slider** | 0 to 100 progress bar with a slider editor. |
| **OTP / PIN** | A 6-digit code in separate boxes. Paste works. |
| **Files** | Attach zip, CSV, PDF and other files (2 MB each, 5 per cell). Download or remove them from the cell. |
| **Rating** | 1 to 5 stars. Click the same star again to clear. |
| **Avatar** | Pick a cartoon avatar from a dropdown. |
| **Icon** | An icon or emoji, from the same picker you use in the sidebar. |
| **Code** | A syntax-highlighted snippet. Choose the language (JavaScript, TypeScript, Python, HTML, CSS, SQL, JSON, Bash) from the dropdown, like on Medium. |
| **Image** | Upload a picture. It is shrunk to fit and shown as a thumbnail. |

## Working with rows and columns

- **Add**: *Add row* in the toolbar, *New row* at the bottom, or the **+** at the end of the header for a column.
- **Reorder**: drag the grip next to a header (columns) or in the first cell of a row (rows). Rows can be dragged when no sort or filter is active.
- **Resize**: drag the right edge of a header.
- **Select**: tick rows one by one, or use the checkbox in the header to **select all**. A bar appears with **Ask AI**, **Delete** and **Clear**.
- **Delete a row**: the trash icon on the row (with *Undo*), or select several and delete them after a confirmation.
- **Delete a table**: the trash icon at the top right, or the trash icon in the sidebar. Both ask first.

## Sorting, searching and filtering

- Click a **header** to sort ascending, again for descending, again to clear.
- The **search box** looks through every cell of every column.
- **Filter** lets you stack rules: column + operator + value (for example *Status is Qualified* and *Value > 1000*). Rows must match all rules.
- Large tables are paged (25, 50, 100 or 200 rows per page).

Sorting, filtering, paging and selection run on **TanStack Table**.

## Nested tables

Tables can live inside other tables in two ways:

1. **Sidebar nesting**: drag a table onto another one, or create a table while one is open to put it inside.
2. **Table link cells**: a column of type *Table link* points to any other table. It works like a page link in a doc.

## The gallery

The gallery has **100 tables in 12 categories**: CRM, Leads, Pipelines, Digital Products, E-commerce, Marketing, Projects, HR & Hiring, Finance, Content, Education and Personal. Each card shows a preview, the columns and what the table is for.

Search is fuzzy, so typos and loose phrases work. `table for leads whatsapp` finds **WhatsApp Leads**; `invoce` finds **Invoice Tracker**.
