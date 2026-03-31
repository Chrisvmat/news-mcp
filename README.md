# 📰 news-mcp

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that brings real-time news into Claude Desktop via RSS feeds — no API key required.

Pulls live headlines from **BBC News**, **CNN**, and **Indian Express** with support for keyword search, category filtering, and article summarisation.

---

## ✨ Features

- 🔴 **Live RSS feeds** — no API key, no rate limits, no cost
- 🌍 **3 major sources** — BBC News, CNN, Indian Express
- 🔍 **Keyword search** across all sources simultaneously
- 📂 **Category filtering** — technology, sport, world, business, science, health, entertainment
- 📄 **Article summaries** — fetch full excerpt from any article URL
- ⚡ **Zero config** — just point Claude Desktop at the file and go

---

## 🛠️ Tools

| Tool | Description |
|---|---|
| `get_top_headlines` | Latest headlines from any or all sources |
| `get_news_by_category` | Filter by category (tech, sport, world, etc.) |
| `search_news` | Search by keyword across all sources |
| `get_article_summary` | Fetch full excerpt from an article URL |

---

## 💬 Example Prompts

Once installed, just talk to Claude naturally:

```
"What are the top headlines today?"
"Get me the latest tech news from BBC"
"Search for news about the Indian election"
"Summarise this article: https://..."
"What's happening in world news right now?"
```

---

## 🚀 Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Claude Desktop](https://claude.ai/download)

### 1. Clone the repo

```bash
git clone https://github.com/vargh/news-mcp.git
cd news-mcp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add to Claude Desktop config

Open your Claude Desktop config file:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

Add the following inside the `mcpServers` object:

**Windows:**
```json
{
  "mcpServers": {
    "news": {
      "command": "node",
      "args": ["C:\\path\\to\\news-mcp\\index.js"]
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "news": {
      "command": "node",
      "args": ["/path/to/news-mcp/index.js"]
    }
  }
}
```

> ⚠️ **Windows users:** Every backslash in the path must be doubled (`\\`). For example `D:\\Projects\\news-mcp\\index.js`. A single `\n` will be read as a newline and silently break the config.

### 4. Restart Claude Desktop

Fully quit Claude (right-click tray icon → Quit) and reopen it. The news tools will appear automatically.

---

## 📡 Sources & RSS Feeds

| Source | Top | Tech | Sport | World | Business |
|---|---|---|---|---|---|
| BBC News | ✅ | ✅ | ✅ | ✅ | ✅ |
| CNN | ✅ | ✅ | ✅ | ✅ | ✅ |
| Indian Express | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📦 Tech Stack

- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server framework
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) — RSS/XML parsing
- Native `fetch` — HTTP requests (Node.js 18+)

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
