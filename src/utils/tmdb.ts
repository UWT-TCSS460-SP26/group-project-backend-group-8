export const fetchPaginatedTmdbData = async (
  baseUrl: string,
  endpoint: string,
  apiKey: string | undefined,
  limitQuery: never,
  queryParam: string = ''
): Promise<{ error?: string; status?: number; results?: Record<string, unknown>[] }> => {
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

    if (limit > totalResults) {
      return {
        error: `Limit of ${limit} exceeds total results (${totalResults})`,
        status: 400,
      };
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

  return { results: allResults.slice(0, limit) };
};
