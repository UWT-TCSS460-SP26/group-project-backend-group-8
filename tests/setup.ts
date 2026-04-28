import 'dotenv/config';
import http from 'http';

// Some local network configurations refuse outbound connections that bind to
// 0.0.0.0:0 (Node's default localAddress). Force the loopback IPv4 address so
// supertest can talk to its own in-process server.
const originalRequest = http.request.bind(http);
const patchedRequest: typeof http.request = (...args: unknown[]) => {
  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    const opts = args[0] as http.RequestOptions & { localAddress?: string; family?: number };
    const host = opts.host || opts.hostname;
    if (host === '127.0.0.1' || host === 'localhost') {
      if (!opts.localAddress) opts.localAddress = '127.0.0.1';
      if (!opts.family) opts.family = 4;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalRequest as any)(...args);
};
http.request = patchedRequest;
