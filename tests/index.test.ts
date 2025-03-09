import request from 'supertest';
import app from '../src/index';

describe('Server', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
}); 