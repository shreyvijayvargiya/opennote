# AI assistant and MCP

## The assistant

Press **⌘L** (or click *Ask AI*) to open the assistant on the right. It is bring-your-own-key: paste an [OpenRouter](https://openrouter.ai) API key once, pick any model from the dropdown in the input box, and chat.

The key and your chats stay in your browser. Messages go straight from your browser to OpenRouter.

### What it can do

The assistant works on **tables**:

| Tool | What it does |
| --- | --- |
| `read_table` | Reads a table (columns, types and rows). Open tables are read **live from the editor**, including text you have not saved yet. |
| `create_table` | Creates a table from columns and rows, or from a gallery template ("a WhatsApp leads table"). It can nest it under another table. |
| `add_rows` | Adds rows. Chip values are matched by label, and new labels become new chips. |
| `update_cells` | Changes cells by row number and column name. |
| `add_column`, `rename_column`, `delete_column` | Edit the structure. |
| `delete_rows` | Removes rows by number. |
| `rename_table` | Renames a table. |
| `delete_table` | Deletes a table. **Always asks you to confirm first.** |

Every change is applied immediately and shown in the chat with **Keep** and **Undo**. Undo restores the exact table from before the change.

### Giving it context

- Type **@** to tag a table. Tagged tables are added to the prompt (trimmed to a 2,000-token cap in total).
- Select rows in a table and click **Ask AI** to send just those rows.
- Attach images, PDFs or CSV files with the **+** button.
- The assistant always knows your table tree and which table is open.

## MCP (use RowTabs from Claude Desktop and other agents)

RowTabs ships a small MCP bridge so tools like Claude Desktop can list and read your tables.

1. Click **Config** at the bottom of the sidebar (or search *MCP config* in ⌘K).
2. Generate an API key and copy the JSON config.
3. Paste it into your MCP client's config and restart it.

The page also registers its tools with **WebMCP**, so a browser agent can use the tables of the tab you have open.

> Because the data lives in your browser, the MCP server is a bridge to the open tab, not a cloud database.
