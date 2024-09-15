import path from 'path';
import fs from 'fs';
import { Logger } from '..';
import { IBannedIP } from '../../interfaces';

export type TIPBan = 'temp' | 'perm';

interface IBanned {
  result: boolean
  type: TIPBan
  attempsRemain: number
}

export class IPBanService {
  private BANNED_PATH = `${path.resolve()}/banned_ips.json`;

  private tempBanned: IBannedIP[] = [];
  private permBanned: IBannedIP[] = [];

  constructor() {
    try {
      this.permBanned = JSON.parse(fs.readFileSync(this.BANNED_PATH).toString()).banned_ips;
      Logger.info(`[IPBanService]: Permanent banned IPs synced`);
    } catch (e) {
      Logger.error(`[IPBanService]: JSON parse error`, e);
    }
  }

  /** Check is ip banned */
  checkBanned(ip: string): IBanned {
    const result: IBanned = {
      result: false,
      type: 'temp',
      attempsRemain: 0
    };

    if (this.permBanned.some(el => el.ip === ip)) result.type = 'perm';
    if (this.tempBanned.some(el => el.ip === ip)) result.type = 'temp';

    if (this.tempBanned.some(el => el.ip === ip)) {
      result.result = true;
      result.attempsRemain = this.tempBanned.find(el => el.ip === ip)?.attempsRemain || 0;
    }

    return result;
  }

  banIP(ip: string) {
    const permExist = this.permBanned.some(el => el.ip === ip);
    const record = this.tempBanned.find(el => el.ip === ip);

    if (permExist) return;

    if (record) {
      if (record.attempsRemain > 1) {
        record.attempsRemain -= 1;
      } else {
        record.attempsRemain = 0;
        this.permBanned.push(record);
        this.write();

        Logger.debug(`[IPBanService]: IP ${ip} banned permanently`);
      }
    } else {
      this.tempBanned.push({
        ip,
        attempsRemain: 5
      });

      Logger.debug(`[IPBanService]: IP ${ip} added to temp ban list`);
    }

  }

  write() {
    fs.writeFileSync(this.BANNED_PATH, JSON.stringify({ banned_ips: this.permBanned }, null, 2));
    Logger.info(`[IPBanService]: Permanent banned IPs writed`);
  }

  resetTempBanned() {
    this.tempBanned = [];
    Logger.info(`[IPBanService]: Temp banned reseted`);
  }
}