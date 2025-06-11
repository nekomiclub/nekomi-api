import User from '~/models/User';
import { Logger } from '~/services/LoggerService';




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