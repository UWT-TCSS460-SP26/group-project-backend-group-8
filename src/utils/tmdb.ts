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

  let allResults = firstPageData.results as Record<string, unknown>[];
  const totalPagesToFetch = Math.ceil(limit / 20);

  if (totalPagesToFetch > 1) {
    const fetchPromises = [];
    for (let page = 2; page <= totalPagesToFetch; page++) {
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

  return { results: allResults.slice(0, limit), totalResults };
};
