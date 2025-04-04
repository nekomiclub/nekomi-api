import { IncomingHttpHeaders } from 'http';

/** Get request IP from HTTP headers */
export function getRequestIP(headers: IncomingHttpHeaders): string {
  return (
    headers['cf-connecting-ip'] ?? headers['CF-Connecting-IP']
    ?? headers['x-forwarded-for'] ?? headers['X-Forwarded-For']
    ?? 'IP_UNDEFINED'
  ) as string;
}

export default getRequestIP;