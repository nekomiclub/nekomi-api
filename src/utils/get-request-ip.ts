import { IncomingHttpHeaders } from 'http';

/** Get request IP from HTTP headers */
export function getRequestIP(headers: IncomingHttpHeaders): string {
  return (headers['cf-connecting-ip'] ?? headers['x-forwarded-for'] ?? 'IP UNDEFINED') as string;
}

export default getRequestIP;