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

## Getting Started

### Prerequisites

- Node.js 18+
- OpenRouter API Key (Optional: only needed for the "Translate & Add" AI voice feature)

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

3. **Setup Environment Variables (Optional)**:
   If you want to use AI-powered voice processing, create a `.env.local` file:

   ```env
   # OpenRouter Config (Optional)
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Model Context Protocol (MCP) Integration

OpenNote includes a built-in MCP bridge that allows Claude Desktop to interact with your local notes.

### 1. Generating an API Key

Open the application, click on your profile in the sidebar, and click **"New API Key"**. This key is stored locally and used to authenticate the MCP bridge.

### 2. Connecting Claude Desktop

The application provides a ready-to-copy JSON configuration in the Profile modal. It automatically detects your project path.

Add the configuration to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Tech Stack

- **Framework**: Next.js (App/Pages)
- **Editor**: Tiptap
- **Database**: Dexie.js (IndexedDB) - **No Firebase / No Cloud DB**
- **State Management**: React Query
- **Visualization**: Three.js & React Force Graph 3D
- **AI**: Transformers.js (Local Embeddings), OpenRouter (LLM), Web Speech API, MCP SDK
- **Styling**: Tailwind CSS & Lucide Icons
- **Notifications**: Sonner

## License

MIT
