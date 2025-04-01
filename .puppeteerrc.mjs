/**
 * PUPPETEER CONFIG  
 * 
 * @copyright fullkekw
 * @version 07.03.2025
*/

import { __dirname, join } from 'path';

/**
 * @type {import("puppeteer").Configuration}
 */
export default {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};