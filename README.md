# News MCP Server

Fetches real-time news from **BBC News**, **CNN**, and **Indian Express** via RSS feeds.

## Tools available
| Tool | Description |
|---|---|
| `get_top_headlines` | Latest headlines from any/all sources |
| `get_news_by_category` | Filter by: technology, sport, world, business, science, health, entertainment |
| `search_news` | Search across all sources by keyword |
| `get_article_summary` | Fetch full summary/excerpt from an article URL |

---

## Setup

### 1. Install dependencies
```bash
cd news-mcp
npm install
```

### 2. Add to Claude Desktop config

Open your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this inside the `mcpServers` object:

```json
{
  "mcpServers": {
    "news": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/news-mcp/index.js"]
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/news-mcp/` with the actual path to this folder.

### 3. Restart Claude Desktop

The news tools will appear automatically.

---

## Example usage in Claude

- *"What are the top headlines today?"*
- *"Search for news about the Indian election"*
- *"Get me the latest tech news from BBC"*
- *"Summarize this article: https://..."*
