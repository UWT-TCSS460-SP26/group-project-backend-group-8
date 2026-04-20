import request from 'supertest';
import { app } from '../../src/app';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockTmdbResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

const gotRaw = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Seven noble families fight for control of the mythical land of Westeros.',
  first_air_date: '2011-04-17',
  poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
};

const searchPage = {
  page: 1,
  results: [gotRaw],
  total_results: 1,
  total_pages: 1,
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.TMDB_API_KEY = 'test-api-key';
});

describe('GET /v1/tv/search', () => {
  // Happy path
  it('returns 200 with transformed results when title is provided', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(searchPage));

    const response = await request(app).get('/v1/tv/search').query({ title: 'Game of Thrones' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Displaying 1 out of 1 results');
    expect(response.body.results).toEqual([
      {
        id: 1399,
        title: 'Game of Thrones',
        synopsis: 'Seven noble families fight for control of the mythical land of Westeros.',
        airDate: '2011-04-17',
        posterUrl: 'https://image.tmdb.org/t/p/original/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/search/tv'));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('query=Game%20of%20Thrones'));
  });

  // Happy path — limit caps results
  it('respects a numeric limit', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(searchPage));
    const response = await request(app).get('/v1/tv/search').query({ title: 'star', limit: '1' });
    expect(response.status).toBe(200);
    expect(response.body.results.length).toBeLessThanOrEqual(1);
  });

  // Sad path — missing title
  it('returns 400 when title is missing', async () => {
    const response = await request(app).get('/v1/tv/search');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/title/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Sad path — non-numeric limit
  it('returns 400 when limit is not numeric', async () => {
    const response = await request(app).get('/v1/tv/search').query({ title: 'star', limit: 'abc' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/limit/i);
  });

  // Edge case — limit of zero
  it('returns 400 when limit is zero', async () => {
    const response = await request(app).get('/v1/tv/search').query({ title: 'star', limit: '0' });
    expect(response.status).toBe(400);
  });

  // Edge case — negative limit
  it('returns 400 when limit is negative', async () => {
    const response = await request(app).get('/v1/tv/search').query({ title: 'star', limit: '-3' });
    expect(response.status).toBe(400);
  });

  // Sad path — TMDB returns an error status
  it('propagates TMDB error status and message', async () => {
    mockFetch.mockResolvedValue(
      mockTmdbResponse({ message: 'Invalid API key' }, { ok: false, status: 401 })
    );
    const response = await request(app).get('/v1/tv/search').query({ title: 'x' });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid API key');
  });

  // Sad path — fetch throws
  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const response = await request(app).get('/v1/tv/search').query({ title: 'x' });
    expect(response.status).toBe(502);
    expect(response.body.error).toMatch(/TMDB/);
  });
});

describe('GET /v1/tv/details', () => {
  // Happy path — id as route param
  it('returns 200 with the series when id is a route param', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(gotRaw));
    const response = await request(app).get('/v1/tv/details/1399');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1399,
      title: 'Game of Thrones',
      synopsis: 'Seven noble families fight for control of the mythical land of Westeros.',
      airDate: '2011-04-17',
      posterUrl: 'https://image.tmdb.org/t/p/original/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/tv/1399'));
  });

  // Happy path — id as query param
  it('returns 200 with the series when id is a query param', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(gotRaw));
    const response = await request(app).get('/v1/tv/details').query({ id: '1399' });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1399);
  });

  // Sad path — missing id
  it('returns 400 when id is missing', async () => {
    const response = await request(app).get('/v1/tv/details');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/id/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Sad path — non-numeric id
  it('returns 400 when id is not numeric', async () => {
    const response = await request(app).get('/v1/tv/details/abc');
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/positive integer/);
  });

  // Edge case — id of zero
  it('returns 400 when id is zero', async () => {
    const response = await request(app).get('/v1/tv/details/0');
    expect(response.status).toBe(400);
  });

  // Edge case — negative id
  it('returns 400 when id is negative', async () => {
    const response = await request(app).get('/v1/tv/details/-5');
    expect(response.status).toBe(400);
  });

  // Sad path — TMDB 404
  it('propagates TMDB 404 with message', async () => {
    mockFetch.mockResolvedValue(
      mockTmdbResponse(
        { message: 'The resource you requested could not be found.' },
        { ok: false, status: 404 }
      )
    );
    const response = await request(app).get('/v1/tv/details/999999999');
    expect(response.status).toBe(404);
    expect(response.body.error).toMatch(/could not be found/);
  });

  // Sad path — fetch throws
  it('returns 502 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('boom'));
    const response = await request(app).get('/v1/tv/details/1399');
    expect(response.status).toBe(502);
    expect(response.body.error).toMatch(/TMDB/);
  });
});

describe('GET /v1/tv/popular', () => {
  // Happy path
  it('returns 200 with a list of popular series', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(searchPage));
    const response = await request(app).get('/v1/tv/popular');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Displaying 1 out of 1 results');
    expect(response.body.results[0].title).toBe('Game of Thrones');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/tv/popular'));
  });

  // Happy path — limit caps results
  it('respects a numeric limit', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(searchPage));
    const response = await request(app).get('/v1/tv/popular').query({ limit: '1' });
    expect(response.status).toBe(200);
    expect(response.body.results.length).toBeLessThanOrEqual(1);
  });

  // Sad path — non-numeric limit
  it('returns 400 when limit is not numeric', async () => {
    const response = await request(app).get('/v1/tv/popular').query({ limit: 'foo' });
    expect(response.status).toBe(400);
  });

  // Edge case — zero limit
  it('returns 400 when limit is zero', async () => {
    const response = await request(app).get('/v1/tv/popular').query({ limit: '0' });
    expect(response.status).toBe(400);
  });

  // Edge case — limit larger than total available results is capped, not errored
  it('does not error when limit exceeds total available results', async () => {
    mockFetch.mockResolvedValue(mockTmdbResponse(searchPage));
    const response = await request(app).get('/v1/tv/popular').query({ limit: '999999' });
    expect(response.status).toBe(200);
  });

  // Sad path — TMDB error
  it('propagates TMDB error', async () => {
    mockFetch.mockResolvedValue(
      mockTmdbResponse({ message: 'Service unavailable' }, { ok: false, status: 503 })
    );
    const response = await request(app).get('/v1/tv/popular');
    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Service unavailable');
  });
});

describe('Missing TMDB_API_KEY', () => {
  beforeEach(() => {
    delete process.env.TMDB_API_KEY;
  });

  it('returns 500 from /v1/tv/search', async () => {
    const response = await request(app).get('/v1/tv/search').query({ title: 'x' });
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/TMDB_API_KEY/);
  });

  it('returns 500 from /v1/tv/details/:id', async () => {
    const response = await request(app).get('/v1/tv/details/1399');
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/TMDB_API_KEY/);
  });

  it('returns 500 from /v1/tv/popular', async () => {
    const response = await request(app).get('/v1/tv/popular');
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/TMDB_API_KEY/);
  });
});
