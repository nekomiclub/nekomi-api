
import User from '../models/User';
import { Logger } from '../services/LoggerService';





interface ICheckValueRules {
  notNaN?: boolean,
  minLength?: number,
  maxLength?: number
}

/** Check value with rules
 * @returns boolean
 * @deprecated
 */
export function checkValue(value: any, { notNaN, maxLength, minLength }: ICheckValueRules): boolean {
  if (notNaN !== undefined && isNaN(+value)) return false;

  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(+value))) {
    if (minLength !== undefined && +value < minLength) return false;
    if (maxLength !== undefined && +value > maxLength) return false;
  } else {
    if (minLength !== undefined && value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
  }

  return true;
}

/** Remove users telegramLinkToken
 * @deprecated must be refactored out of that file
 */
export async function removeUsersLinkTelegramToken() {
  const users = await User.find({ telegramLinkToken: { $ne: null } });

  if (!users.length) return;

  for (const key in users) {
    const user = users[key];

    user.telegramLinkToken = null;
    user.markModified('telegramLinkToken');

    await user.save();
  }

  Logger.info(`[Handler/UsersTelegramToken]: Tokens revoked due to server restart`);
}