(() => {
  const originalFetch = globalThis.fetch.bind(globalThis);

  const chartData = {
    PostsOverTime: {
      postsOverTime: [
        { month: "2024-03", count: 2 },
        { month: "2024-01", count: 4 },
        { month: "2024-02", count: 1 },
      ],
    },
    ReadingTimeDistribution: {
      readingTimeDistribution: [
        { category: "0-2 minutes", count: 1 },
        { category: "2-5 minutes", count: 3 },
        { category: "5-10 minutes", count: 2 },
        { category: "10+ minutes", count: 1 },
      ],
    },
    TopArtists: {
      topArtists: [
        { name: "Artist B", scrobbles: 12 },
        { name: "Artist A", scrobbles: 25 },
      ],
    },
    TopTags: {
      topTags: [
        { name: "post-punk", count: 8 },
        { name: "ambient", count: 13 },
      ],
    },
    TopTracks: {
      topTracks: [
        {
          name: "First track",
          stats: { userPlayCount: 17 },
          artist: { name: "Artist A" },
        },
        {
          name: "Second track",
          stats: { userPlayCount: 9 },
          artist: { name: "Artist B" },
        },
      ],
    },
  };

  globalThis.__CAIRN_REQUESTS__ = [];

  async function parseBody(input, init) {
    const body =
      init?.body ??
      (input instanceof Request ? await input.clone().text() : undefined);

    if (typeof body !== "string" || body.length === 0) return undefined;

    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const parsedUrl = new URL(url, globalThis.location.href);

    if (parsedUrl.pathname === "/api/graphql") {
      const body = await parseBody(input, init);
      const operations = Array.isArray(body) ? body : [body];
      const responses = operations.map((operation) => {
        const operationName = operation?.operationName;
        const data = operationName ? chartData[operationName] : undefined;

        return data
          ? { data }
          : { errors: [{ message: `Unexpected operation: ${operationName}` }] };
      });

      globalThis.__CAIRN_REQUESTS__.push({
        path: parsedUrl.pathname,
        body,
      });

      return new Response(
        JSON.stringify(Array.isArray(body) ? responses : responses[0]),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (parsedUrl.pathname === "/api/chat/stream") {
      const body = await parseBody(input, init);
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );

      const requestRecord = {
        path: parsedUrl.pathname,
        body,
        locale: headers.get("locale"),
      };
      globalThis.__CAIRN_REQUESTS__.push(requestRecord);
      sessionStorage.setItem(
        "__cairn_last_chat_request",
        JSON.stringify(requestRecord),
      );

      if (globalThis.location.pathname.startsWith("/ru")) {
        return new Response("{}", {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      const answer =
        "A deterministic archive answer. [NAVIGATE:/projects#project-cortex]";
      const stream = [
        'data: {"type":"start"}',
        "",
        `data: ${JSON.stringify(answer)}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      return new Response(stream, {
        status: 200,
        headers: {
          "cache-control": "no-cache",
          "content-type": "text/event-stream; charset=utf-8",
        },
      });
    }

    return originalFetch(input, init);
  };
})();
