import request from 'supertest';
import { app } from '../../src/app';

describe.skip('GET /movies/:id/details', () => {
  it('200 — returns TMDB metadata + community aggregate', async () => {
    const res = await request(app).get('/movies/550/details');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('reviewCount');
    expect(Array.isArray(res.body.recentReviews)).toBe(true);
  });

  it('404 — nonexistent TMDB id', async () => {
    const res = await request(app).get('/movies/999999999/details');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('stack');
  });
});
