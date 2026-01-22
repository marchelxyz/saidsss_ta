import { getSearchConfig } from "@/lib/env";

export type SearchProvider = "tavily_api" | "tavily_mcp";

export type SearchOptions = {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
};

export type SearchResult = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  published_date?: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};

/**
 * Searches the web using the configured provider.
 */
export async function searchWeb(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return { query, results: [] };
  }

  const config = getSearchConfig();
  if (config.provider === "tavily_mcp") {
    return searchWithTavilyMcp(normalizedQuery, config, options);
  }
  return searchWithTavilyApi(normalizedQuery, config, options);
}

/**
 * Searches using the Tavily HTTP API.
 */
export async function searchWithTavilyApi(
  query: string,
  config = getSearchConfig(),
  options?: SearchOptions
): Promise<SearchResponse> {
  if (!config.apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const endpoint = `${config.apiBase.replace(/\/$/, "")}/search`;
  const body = {
    api_key: config.apiKey,
    query,
    search_depth: options?.searchDepth ?? config.searchDepth,
    max_results: options?.maxResults ?? config.maxResults,
    include_answer: false,
    include_images: false
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Tavily search failed");
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
      score?: number;
      published_date?: string;
    }>;
  };

  return {
    query,
    results: normalizeSearchResults(data.results)
  };
}

/**
 * Searches using a Tavily MCP HTTP bridge.
 */
export async function searchWithTavilyMcp(
  query: string,
  config = getSearchConfig(),
  options?: SearchOptions
): Promise<SearchResponse> {
  if (!config.mcpEndpoint) {
    throw new Error("TAVILY_MCP_ENDPOINT is not set");
  }

  const response = await fetch(config.mcpEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      search_depth: options?.searchDepth ?? config.searchDepth,
      max_results: options?.maxResults ?? config.maxResults
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Tavily MCP search failed");
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
      score?: number;
      published_date?: string;
    }>;
  };

  return {
    query,
    results: normalizeSearchResults(data.results)
  };
}

function normalizeSearchResults(
  results: Array<{
    title?: string;
    url?: string;
    content?: string;
    score?: number;
    published_date?: string;
  }> | undefined
): SearchResult[] {
  if (!Array.isArray(results)) return [];
  return results
    .filter((item) => Boolean(item.url))
    .map((item) => ({
      title: item.title ?? "",
      url: item.url ?? "",
      content: item.content,
      score: item.score,
      published_date: item.published_date
    }));
}
