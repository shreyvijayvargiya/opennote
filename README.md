# OpenNote - Local-First AI Note Taking App

OpenNote is a privacy-focused, **local-first** note-taking application. Unlike traditional apps, OpenNote **does not use Firebase, Supabase, or any cloud database**. Everything you create stays on your machine.

It combines rich-text editing (Tiptap), high-performance local storage (IndexedDB), and advanced AI capabilities (MCP & Local Embeddings).

## Features

- **Purely Local Storage**: Your notes are stored in your browser's IndexedDB via **Dexie.js**. Zero cloud dependency, zero latency, and 100% privacy.
- **Tiptap Rich Text Editor**:
  - Markdown-like commands (`/` slash menu).
  - **Smart Link Support**: Automatic link detection (e.g., typing `google.com` creates a link) and custom link editing in Indigo.
  - Image, table, and task list support.
- **Privacy-First AI**:
  - **Local Embeddings**: Uses **Transformers.js** to run vector models directly in your browser. **No OpenAI API key required** for the graph visualization!
  - **3D Neural Map**: Explore note connections through a beautiful 3D force graph based on semantic similarity.
- **Model Context Protocol (MCP)**: Seamlessly connect your local notes to Claude Desktop, allowing AI agents to search and read your private notes without them ever leaving your computer.
- **Voice-to-Text**: Record notes via the Web Speech API and optionally process them with OpenRouter for clean-up, translation, and structuring.
- **AI Assistant (right panel)**: A Claude-style chat that reads and edits your notes. Bring your own [OpenRouter](https://openrouter.ai) key and pick any model from the input. See [AI Assistant](#ai-assistant).
- **Split view**: Open up to 2 notes side by side with a draggable divider.
- **Sidebar**: nested notes and folders, drag & drop to move notes, create inside the active note, confirm-before-delete.
- **Selection toolbar**: select text for Bold, Italic, Link, List, Heading, Copy and **Ask AI**.
- **Export**: download any note as Markdown (`.md`) or HTML (`.html`) next to the copy button.

## Getting Started

### Prerequisites

- Node.js 18+
- OpenRouter API Key (Optional: only needed for the AI assistant; paste it in the chat panel, it stays in your browser)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shreyvijayvargiya/opennote.git
   cd opennote
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Model Context Protocol (MCP) Integration

OpenNote includes a built-in MCP bridge that allows Claude Desktop to interact with your local notes.

### 1. Generating an API Key

Open the application, click on your profile in the sidebar, and click **"New API Key"**. This key is stored locally and used to authenticate the MCP bridge.

### 2. Connecting Claude Desktop

The application provides a ready-to-copy JSON configuration in the Profile modal. It automatically detects your project path.

Add the configuration to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## AI Assistant

Open it with **⌘/Ctrl + L** (or the *Ask AI* button), then add your OpenRouter key when asked. The key is stored only in your browser's IndexedDB and is only ever sent to `openrouter.ai`.

| Feature | How it works |
| --- | --- |
| **Models** | Dropdown inside the chat input. Edit the list in `lib/ai/openrouter.js` (`MODELS`). |
| **Tag notes** | Type `@` and pick a note; the list opens at the cursor. Tagged notes are injected into the prompt. |
| **Ask AI** | Select text in an editor, click **Ask AI**: the text is attached to the chat with its note id. |
| **Attachments** | `+` button, drag & drop, or paste: images (copy/paste works), PDF (parsed by OpenRouter) and CSV. |
| **Dictation** | Mic button in the input (Web Speech API). |
| **History** | Clock icon: up to **10** chats × **50** messages are kept in IndexedDB (oldest pruned). Delete one or all. |
| **Image preview** | Click any image (in the input or a message) to open it full size. Right-click, or use `⌘/Ctrl+C` (copy) / `⌘/Ctrl+S` (download) / `Esc` (close). These keys are only active while the preview is open. |
| **Export chat** | Download icon in the chat header: Markdown or HTML. |
| **Copy & time** | Every message has a timestamp and a copy button. |

**The AI reads the live editor, not the database.** Open notes are read from (and written to) the Tiptap editor, so unsaved typing is included. Only notes that are not open fall back to IndexedDB. The system prompt contains the folder/page tree (with ids) so the model understands your structure, and nested pages show up as `[Title](page://id)` links.

**Context is capped.** Tagged notes + selections share a **2,000 token** budget; long notes are trimmed and get a heading outline instead (the model can call `read_note` for more).

**Edits are reviewable, deletes are gated** (like Cursor):

- `update_note` / `create_note` are applied right away and the chat shows **Keep** / **Undo** for each change.
- `delete_note` always opens a confirmation dialog first; nothing is deleted until you confirm.

Tune the limits in one place, `lib/ai/useChat.js`: `MAX_CHATS`, `MAX_MESSAGES`, `CONTEXT_TOKEN_CAP`.

## Keyboard Shortcuts

Shortcuts are registered once in `lib/components/RootLayout.jsx` with [react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook) (no `useEffect`).

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl + L` | Open the AI assistant and focus its input |
| `⌘/Ctrl + B` | Toggle the left sidebar (Bold keeps its toolbar button; its shortcut is disabled) |
| `Enter` / `Shift + Enter` | Send / new line in the chat input |
| `@` | Tag a note in the chat input |
| `Esc`, `⌘/Ctrl+C`, `⌘/Ctrl+S` | Close / copy / download, **only while the image preview is open** |

## Sidebar & Split View

- **New note / folder**: the `+` next to search creates at the top level, or *inside the active note* when one is open.
- **Drag & drop** ([dnd-kit](https://dndkit.com)): drop a note on another to nest it; drop it on the "Move to top level" strip to un-nest.
- **Split view**: hover a note and click the split icon to open it beside the current one (max 2 panes, drag the divider to resize).
- **Delete** asks for confirmation.

## Tech Stack

- **Framework**: Next.js (App/Pages)
- **Editor**: Tiptap
- **Database**: Dexie.js (IndexedDB) - **No Firebase / No Cloud DB**
- **State Management**: React Query
- **Visualization**: Three.js & React Force Graph 3D
- **AI**: Transformers.js (Local Embeddings), OpenRouter (LLM, streaming + tool calls), Web Speech API, MCP SDK
- **UI**: shadcn/ui pattern (Radix UI + class-variance-authority + tailwind-merge), Tailwind CSS & Lucide Icons
- **Notifications**: Sonner

### npm modules added for the assistant & app shell

| Module | Used for |
| --- | --- |
| `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-context-menu`, `@radix-ui/react-slot` | shadcn-style dialog, dropdowns (history, model picker, add menu), image right-click menu and button |
| `class-variance-authority`, `clsx`, `tailwind-merge` | `cn()` helper and component variants |
| `react-hotkeys-hook` | global shortcuts (⌘L, ⌘B) |
| `@dnd-kit/core` | sidebar drag & drop |
| `react-resizable-panels` | split view with resizable width |
| `react-markdown` | rendering assistant replies |
| `textarea-caret` | positioning the `@` dropdown at the cursor |
| `@tiptap/extension-bubble-menu`, `@tiptap/extension-bold` | selection toolbar, freeing ⌘B |

## Project Structure

```
pages/
  _app.js                 Providers + RootLayout (hotkeys)
  index.js                App shell: sidebar, editor panes (split view), chat panel
  graph-notes.js          3D neural map
  api/                    MCP endpoints
lib/
  ai/
    useChat.js            The single chat hook: history, streaming, tool loop, Keep/Undo
    openrouter.js         OpenRouter streaming client + model list
    tools.js              read / create / update / delete note tools
    noteOps.js            Live-editor registry, Markdown <-> HTML, tree outline, 2k-token context
    attachments.js        Image / PDF / CSV processing
    exportChat.js         Chat -> Markdown / HTML
  components/
    chat/                 ChatPanel, ChatInput, MessageItem, ImagePreview
    ui/                   shadcn-style button, dialog, dropdown-menu
    Sidebar.jsx           Tree, search, add, drag & drop, delete dialog
    SelectionToolbar.jsx  Floating toolbar on text selection
    RootLayout.jsx        Global keyboard shortcuts
    TiptapEditor.jsx      The editor (+ export, live-editor registration)
  context/                AppContext (sidebar / chat / panes), ThemeContext
  db/                     Dexie schema (notes, settings, apiKeys, chats) + noteService
  mcp/                    WebMCP tool definitions
  tiptap/, ui/, utils/    Editor extensions and helpers
mcp-server/               stdio bridge for Claude Desktop
```

## License

MIT
