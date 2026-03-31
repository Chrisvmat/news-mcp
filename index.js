#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";

// ── RSS Feed Sources ─────────────────────────────────────────────────────────
const SOURCES = {
  bbc: {
    name: "BBC News",
    feeds: {
      top:        "https://feeds.bbci.co.uk/news/rss.xml",
      technology: "https://feeds.bbci.co.uk/news/technology/rss.xml",
      sport:      "https://feeds.bbci.co.uk/sport/rss.xml",
      world:      "https://feeds.bbci.co.uk/news/world/rss.xml",
      business:   "https://feeds.bbci.co.uk/news/business/rss.xml",
      science:    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
      health:     "https://feeds.bbci.co.uk/news/health/rss.xml",
      entertainment: "https://feeds.bbci.co.uk/news/entertainment_arts/rss.xml",
    },
  },
  cnn: {
    name: "CNN",
    feeds: {
      top:        "http://rss.cnn.com/rss/cnn_topstories.rss",
      technology: "http://rss.cnn.com/rss/cnn_tech.rss",
      sport:      "http://rss.cnn.com/rss/edition_sport.rss",
      world:      "http://rss.cnn.com/rss/edition_world.rss",
      business:   "http://rss.cnn.com/rss/money_latest.rss",
      health:     "http://rss.cnn.com/rss/cnn_health.rss",
      entertainment: "http://rss.cnn.com/rss/cnn_showbiz.rss",
    },
  },
  indianexpress: {
    name: "Indian Express",
    feeds: {
      top:        "https://indianexpress.com/feed/",
      technology: "https://indianexpress.com/section/technology/feed/",
      sport:      "https://indianexpress.com/section/sports/feed/",
      world:      "https://indianexpress.com/section/world/feed/",
      business:   "https://indianexpress.com/section/business/feed/",
      entertainment: "https://indianexpress.com/section/entertainment/feed/",
    },
  },
};

const CATEGORIES = ["top", "technology", "sport", "world", "business", "science", "health", "entertainment"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

async function fetchFeed(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsMCP/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const xml = await res.text();
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item || data?.feed?.entry || [];
  return (Array.isArray(items) ? items : [items]).map(normaliseItem).filter(Boolean);
}

function normaliseItem(item) {
  if (!item) return null;
  return {
    title:       strip(item.title),
    link:        item.link?.["#text"] || item.link || item.guid?.["#text"] || item.guid || "",
    summary:     strip(item.description || item.summary || item["content:encoded"] || ""),
    published:   item.pubDate || item.published || item.updated || "",
    source:      "",
  };
}

function strip(html = "") {
  if (typeof html !== "string") html = String(html);
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}

async function fetchSource(sourceKey, category = "top") {
  const source = SOURCES[sourceKey];
  const feedUrl = source.feeds[category] || source.feeds.top;
  const items = await fetchFeed(feedUrl);
  return items.map(i => ({ ...i, source: source.name }));
}

async function fetchAll(category = "top") {
  const results = await Promise.allSettled(
    Object.keys(SOURCES).map(k => fetchSource(k, category))
  );
  return results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);
}

function formatArticles(articles, limit = 10) {
  return articles.slice(0, limit).map((a, i) =>
    `${i + 1}. [${a.source}] ${a.title}\n   ${a.published ? `Published: ${a.published}\n   ` : ""}Link: ${a.link}${a.summary ? `\n   Summary: ${a.summary.slice(0, 200)}${a.summary.length > 200 ? "…" : ""}` : ""}`
  ).join("\n\n");
}

// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "news-mcp",
  version: "1.0.0",
});

// Tool 1: Get top headlines
server.tool(
  "get_top_headlines",
  "Get the latest top headlines from BBC News, CNN, and Indian Express",
  {
    source: z.enum(["all", "bbc", "cnn", "indianexpress"]).default("all").describe("Which source to fetch from"),
    limit:  z.number().min(1).max(30).default(10).describe("Number of articles to return"),
  },
  async ({ source, limit }) => {
    const articles = source === "all"
      ? await fetchAll("top")
      : await fetchSource(source, "top");
    if (!articles.length) return { content: [{ type: "text", text: "No articles found." }] };
    return { content: [{ type: "text", text: `📰 Top Headlines\n\n${formatArticles(articles, limit)}` }] };
  }
);

// Tool 2: Filter by category
server.tool(
  "get_news_by_category",
  "Get news filtered by category (technology, sport, world, business, health, entertainment, science)",
  {
    category: z.enum(["technology", "sport", "world", "business", "science", "health", "entertainment"]).describe("News category"),
    source:   z.enum(["all", "bbc", "cnn", "indianexpress"]).default("all").describe("Which source to fetch from"),
    limit:    z.number().min(1).max(30).default(10).describe("Number of articles to return"),
  },
  async ({ category, source, limit }) => {
    const articles = source === "all"
      ? await fetchAll(category)
      : await fetchSource(source, category);
    if (!articles.length) return { content: [{ type: "text", text: `No articles found for category: ${category}` }] };
    return { content: [{ type: "text", text: `📂 ${category.charAt(0).toUpperCase() + category.slice(1)} News\n\n${formatArticles(articles, limit)}` }] };
  }
);

// Tool 3: Search by keyword
server.tool(
  "search_news",
  "Search for news articles by keyword across all sources",
  {
    query:  z.string().describe("Search keyword or phrase"),
    source: z.enum(["all", "bbc", "cnn", "indianexpress"]).default("all").describe("Which source to search"),
    limit:  z.number().min(1).max(30).default(10).describe("Number of results to return"),
  },
  async ({ query, source, limit }) => {
    // Fetch all categories to search broadly
    const allArticles = [];
    for (const cat of CATEGORIES) {
      try {
        const articles = source === "all"
          ? await fetchAll(cat)
          : await fetchSource(source, cat);
        allArticles.push(...articles);
      } catch {}
    }

    // Deduplicate by link
    const seen = new Set();
    const unique = allArticles.filter(a => {
      if (seen.has(a.link)) return false;
      seen.add(a.link);
      return true;
    });

    const q = query.toLowerCase();
    const matches = unique.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q)
    );

    if (!matches.length) return { content: [{ type: "text", text: `No articles found matching "${query}".` }] };
    return { content: [{ type: "text", text: `🔍 Search results for "${query}"\n\n${formatArticles(matches, limit)}` }] };
  }
);

// Tool 4: Get full article summary
server.tool(
  "get_article_summary",
  "Fetch and return the full summary/description of a specific article by its URL",
  {
    url: z.string().url().describe("The article URL to fetch summary for"),
  },
  async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsMCP/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Extract meta description and og:description
      const metaDesc   = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || "";
      const ogDesc     = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] || "";
      const ogTitle    = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] || "";
      const title      = html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";

      // Extract article body paragraphs (best effort)
      const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => strip(m[1]))
        .filter(p => p.length > 60)
        .slice(0, 8)
        .join("\n\n");

      const output = [
        `📄 ${ogTitle || title}`,
        ogDesc || metaDesc ? `\n🔎 Description: ${ogDesc || metaDesc}` : "",
        paragraphs ? `\n\n📝 Article excerpt:\n${paragraphs}` : "",
        `\n\n🔗 ${url}`,
      ].join("").trim();

      return { content: [{ type: "text", text: output || "Could not extract article content." }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to fetch article: ${e.message}` }] };
    }
  }
);

// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
