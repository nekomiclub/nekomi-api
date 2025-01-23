import Search from '~/services/SearchService';
import UserModel from '~/Models/User';
import { DocumentDTO, MongoDocumentDTO } from '~/core/Services/DTO';
import { IUser } from '~/interfaces/IUser';
import { NotifyService } from '~/services/NotifyService';



//* ===================================== GET SEARCH
export interface IUserGetSearch {
  /** Query ~all will return all users */
  q: string

  /** Parse user invitation data (can/not be invited, already member) for dubber id */
  parseInvitationStatusFor?: string
}

export interface IUserGetSearchResult {
  user: IUser

  /** @requires parseInvitationStatusFor */
  invitationStatus?: 'can_be_invited' | 'telegram_not_linked' | 'invite_pending' | 'others_member_already'
}

async function GetSearch({ q, parseInvitationStatusFor }: IUserGetSearch) {
  const limit = 15;

  let userResults: IUser[] = [];

  if (q === '~all') {
    // Get all
    userResults = (await UserModel.find()).slice(0, limit).map(el => new MongoDocumentDTO().user({ document: el, details: true }));
  } else {
    userResults = Search.search({ query: q, engine: 'user', limit });
  }

  const results: IUserGetSearchResult[] = [];

  userResults.forEach(user => {
    let invitationStatus: IUserGetSearchResult['invitationStatus'] = undefined;

    // Parse invitation status
    if (parseInvitationStatusFor) {
      const isTelegramNotLinked = !user.statistics.isTelegramLinked;
      const isInvitePending = user.subscribes.includes(NotifyService.createEvent({ event: 'dubber_invite_pending', key: parseInvitationStatusFor }));
      const isOthersMemberAlready = user.statistics.dubber_team_member;

      if (isTelegramNotLinked) {
        invitationStatus = 'telegram_not_linked';
      } else if (isInvitePending) {
        invitationStatus = 'invite_pending';
      } else if (isOthersMemberAlready) {
        invitationStatus = 'others_member_already';
      } else {
        invitationStatus = 'can_be_invited';
      }
    }

    results.push({
      user: new DocumentDTO().user({ object: user }),
      invitationStatus
    });
  });

  return {
    status: 200,
    message: 'ok',
    results
  };
}




export default class UserController {
  static GetSearch = GetSearch;
}