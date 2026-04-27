export const fetchPaginatedTmdbData = async (
  baseUrl: string,
  endpoint: string,
  apiKey: string | undefined,
  limitQuery: unknown,
  queryParam: string = ''
): Promise<{
  error?: string;
  status?: number;
  results?: Record<string, unknown>[];
  totalResults?: number;
  maxResults?: number;
}> => {
  const urlSuffix = queryParam ? `&${queryParam}` : '';
  const firstPageUrl = `${baseUrl}${endpoint}?api_key=${apiKey}${urlSuffix}&page=1`;

  const firstPageResult = await fetch(firstPageUrl);
  const firstPageData = (await firstPageResult.json()) as Record<string, unknown>;

  if (!firstPageResult.ok) {
    return {
      error: (firstPageData.message as string) || 'TMDB API error',
      status: firstPageResult.status,
    };
  }

  const totalResults = firstPageData.total_results as number;
  let limit = 20;

  if (limitQuery) {
    limit = parseInt(String(limitQuery), 10);
    // If the requested limit is greater than the total available results,
    // gracefully cap the limit to the total results instead of throwing an error.
    if (limit > totalResults) {
      limit = totalResults;
    }
  }

  // TMDB restricts pagination to a maximum of 500 pages (10,000 results)
  // We must enforce this hard limit to prevent the server from crashing
  // or TMDB blocking our IP for abuse.
  const MAX_TMDB_PAGES = 500;
  const MAX_RESULTS = MAX_TMDB_PAGES * 20;

  let maxResults = totalResults;
  if (totalResults > MAX_RESULTS) {
    maxResults = MAX_RESULTS;
  }

  if (limit > MAX_RESULTS) {
    limit = MAX_RESULTS;
  }

  let allResults = firstPageData.results as Record<string, unknown>[];
  const totalPagesToFetch = Math.min(Math.ceil(limit / 20), MAX_TMDB_PAGES);

  if (totalPagesToFetch > 1) {
    // Fetch remaining pages in small batches to avoid overwhelming Node.js memory
    // and to respect TMDB rate limits.
    const CONCURRENT_BATCH_SIZE = 10;

    for (let i = 2; i <= totalPagesToFetch; i += CONCURRENT_BATCH_SIZE) {
      const fetchPromises = [];
      const endPage = Math.min(i + CONCURRENT_BATCH_SIZE - 1, totalPagesToFetch);

      for (let page = i; page <= endPage; page++) {
        fetchPromises.push(
          fetch(`${baseUrl}${endpoint}?api_key=${apiKey}${urlSuffix}&page=${page}`).then((res) =>
            res.json()
          )
        );
      }

      const remainingPagesData = await Promise.all(fetchPromises);
      for (const pageData of remainingPagesData) {
        const data = pageData as Record<string, unknown>;
        if (data.results) {
          allResults = allResults.concat(data.results as Record<string, unknown>[]);
        }
      }
    }
  }

  return { results: allResults.slice(0, limit), totalResults, maxResults };
};
