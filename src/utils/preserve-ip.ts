/** Return localhost if raw match 0.0.0.0 */
export function preserveIP(ip: string): string {
  return ip === '0.0.0.0' ? '127.0.0.1' : ip;
}

export default preserveIP;