import { Request, Response, NextFunction } from 'express';
import { logger } from '../src/middleware/logger';

describe('Logger middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = { method: 'GET', path: '/health' };
    mockResponse = {};
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // Happy path — middleware passes control
  it('should call next()', () => {
    logger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  // Happy path — logs method and path
  it('should log the HTTP method and request path', () => {
    logger(mockRequest as Request, mockResponse as Response, mockNext);
    const logMessage: string = consoleSpy.mock.calls[0][0];
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/health');
  });

  // Happy path — includes ISO timestamp
  it('should include an ISO timestamp in the log', () => {
    logger(mockRequest as Request, mockResponse as Response, mockNext);
    const logMessage: string = consoleSpy.mock.calls[0][0];
    expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  // Happy path — works for different methods
  it('should log POST /data correctly', () => {
    const postRequest = { method: 'POST', path: '/data' } as Partial<Request>;
    logger(postRequest as Request, mockResponse as Response, mockNext);
    const logMessage: string = consoleSpy.mock.calls[0][0];
    expect(logMessage).toContain('POST');
    expect(logMessage).toContain('/data');
  });
});
