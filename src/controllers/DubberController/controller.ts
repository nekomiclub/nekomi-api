import * as dto from '~/handlers/dtos';
import Cache, { ICacheDubbedAnime } from '~/services/CacheService';
import DubberService, { ERR_DUBBER_NOT_INVITED } from '~/core/services/DubberService';
import TitleModel from '~/Models/Title';
import { DocumentDTO } from '~/core/services/DTO';
import { E500, ERR_ACCESS_REJECTED, ERR_TYPE_INVALID } from '~/services/ErrorService';
import { IDubber, TDubberMemberRole } from '~/interfaces/Dubber';
import { IEXPRESS_REQ_NEKOMI_USER } from '~/interfaces/globals';
import { ITitle } from '~/interfaces/Title';



//* ===================================== GET ONE
export interface IDubberGetOneByQueryProps {
  query: string
  detailed?: boolean
  fetchDubbedAnime?: boolean
}

async function GetOneByQuery({ query, detailed, fetchDubbedAnime }: IDubberGetOneByQueryProps) {
  const dubberService = new DubberService();
  await dubberService.init(query);

  let dubber = new DocumentDTO().dubber({ object: dubberService.dubber });
  let dubbedAnime: ITitle[] | undefined = undefined;

  if (detailed) {
    dubber = new DocumentDTO().dubber({ object: dubberService.dubber, details: true });
  }

  if (fetchDubbedAnime) {
    const cached = Cache.getDubbedAnime(dubberService.dubber.id);

    if (cached) {
      dubbedAnime = cached;
    } else {
      const titles = (await TitleModel.find()).map(el => dto.title(el.toObject(), false));
      const withDubbing = titles.filter(title => {
        return title.episodes?.some(ep => ep.dubberID === dubberService.dubber.id);
      });

      dubbedAnime = withDubbing.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8).map(el => dto.title({
        __v: 0,
        _id: '',
        ...el
      }, true));

      Cache.push<ICacheDubbedAnime>({
        dubberId: dubberService.dubber.id,
        titles: dubbedAnime
      });
    }
  }

  return {
    status: 200,
    message: `ok${detailed ? ' + private details' : ''}`,
    dubber,
    dubbedAnime
  };
}



//* ===================================== PATCH SETTINGS
export interface IDubberPatchSettingsProps {
  dubberId: string
  userId: string
  currentUser: IEXPRESS_REQ_NEKOMI_USER
  nameUkr?: string
  nameEng?: string
  description?: string
  supportLinks?: Partial<IDubber['support']>
  socialLinks?: Partial<IDubber['socials']>
}

async function PatchSettings({ dubberId, description, nameEng, nameUkr, socialLinks, supportLinks, currentUser }: IDubberPatchSettingsProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);


  //* Ensure access
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);

  // Pass root or admin
  if (!currentUser.capabilities.includes('root') && !currentUser.capabilities.includes('admin')) {
    // Only team member can edit settings
    if (!currentMember) throw new ERR_ACCESS_REJECTED(`Can not edit settings of the team what you don't belong to`);
    // Only leader can edit settings
    if (currentMember.role !== 'leader') throw new ERR_ACCESS_REJECTED(`Only team leader can edit settings`);
  }



  if (typeof nameUkr === 'string') await dubberService.changeName({ nameUkr });
  if (typeof nameEng === 'string') await dubberService.changeName({ nameEng });
  if (typeof description === 'string') await dubberService.changeDescription(description);

  if (typeof socialLinks === 'object') {
    for (const key in socialLinks) {
      if (typeof socialLinks[key] === 'string') await dubberService.changeSocials({ key: key as keyof IDubber['socials'], value: socialLinks[key] });
      else throw new ERR_TYPE_INVALID(`Social link for ${key} type is invalid`);
    }
  }

  if (typeof supportLinks === 'object') {
    for (const key in supportLinks) {
      if (typeof supportLinks[key] === 'string') await dubberService.changeSupport({ key: key as keyof IDubber['support'], value: supportLinks[key] });
      else throw new ERR_TYPE_INVALID(`Support link for ${key} type is invalid`);
    }
  }

  await dubberService.save();



  return {
    status: 200,
    message: 'Dubber settings changed',
    dubber: new DocumentDTO().dubber({ object: dubberService.dubber })
  };
}



//* ===================================== GET INVITE BY ID
export interface IDubberGetInviteByIdProps {
  dubberId: string
  userId: string
}

async function GetInviteById({ dubberId, userId }: IDubberGetInviteByIdProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

  // Throw error if user is not invited
  if (!dubberService.dubber.membersInvited.includes(userId)) throw ERR_DUBBER_NOT_INVITED;

  return {
    status: 200,
    message: `Invite in dubber team id:${dubberId} for user id:${userId} is valid`
  };
}



//* ===================================== POST INVITE SEND
/** SAD - not sad really, it's send accept decline */
export interface IDubberPostInviteSADProps {
  userId: string
  dubberId: string
  /** Only for PostInviteSend method */
  currentUser?: IEXPRESS_REQ_NEKOMI_USER
}

async function PostInviteSend({ dubberId, userId, currentUser }: IDubberPostInviteSADProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);


  //* Ensure access
  if (!currentUser) throw new E500(`Current user is not specified`);
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);

  // Pass root or admin
  if (!currentUser.capabilities.includes('root') && !currentUser.capabilities.includes('admin')) {
    // Only team member can invite
    if (!currentMember) throw new ERR_ACCESS_REJECTED(`Can not invite members in the team what you don't belong to`);
    // Only leader can invite
    if (currentMember.role !== 'leader') throw new ERR_ACCESS_REJECTED(`Only team leader can send the invitation`);
  }



  await dubberService.memberInvite({ id: userId });

  return {
    status: 200,
    message: `User id:${userId} has been invited to the dubber team id:${dubberId}`
  };
}



//* ===================================== POST INVITE ACCEPT
async function PostInviteAccept({ dubberId, userId }: IDubberPostInviteSADProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

  await dubberService.memberAdd({ id: userId, checkInvitation: true });

  return {
    status: 200,
    message: `Invite to dubber team id:${dubberId} was accepted`
  };
}




//* ===================================== POST INVITE DECLINE
async function PostInviteDecline({ dubberId, userId }: IDubberPostInviteSADProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

  await dubberService.memberDelete({ id: userId, declineInvite: true });

  return {
    status: 200,
    message: `Invite to dubber team id:${dubberId} was declined`
  };
}



//* ===================================== POST MEMBER EDIT
export interface IDubberPatchMemberByIdProps {
  dubberId: string
  userId: string
  role?: TDubberMemberRole
  currentUser: IEXPRESS_REQ_NEKOMI_USER
}

async function PatchMemberById({ dubberId, userId, role, currentUser }: IDubberPatchMemberByIdProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);



  //* Ensure access
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);

  // Pass root or admin
  if (!currentUser.capabilities.includes('root') && !currentUser.capabilities.includes('admin')) {
    // Only team member can edit members
    if (!currentMember) throw new ERR_ACCESS_REJECTED(`Can not edit members of the team what you don't belong to`);
    // Only leader can edit members
    if (currentMember.role !== 'leader') throw new ERR_ACCESS_REJECTED(`Only team leader can edit members`);
  }



  if (typeof role === 'string') await dubberService.memberEdit({ id: userId, role });

  await dubberService.save();

  return {
    status: 200,
    message: `Member ${userId} patched`
  };
}


//* ===================================== POST MEMBER KICK
export interface IDubberDeleteMemberByIdProps {
  dubberId: string
  userId: string
  currentUser: IEXPRESS_REQ_NEKOMI_USER
}

async function DeleteMemberById({ dubberId, userId, currentUser }: IDubberDeleteMemberByIdProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);


  //* Ensure access
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);

  // Pass root or admin
  if (!currentUser.capabilities.includes('root') && !currentUser.capabilities.includes('admin')) {
    // Only team member can kick members
    if (!currentMember) throw new ERR_ACCESS_REJECTED(`Can not delete members of the team what you don't belong to`);
    // Only leader can kick members
    if (currentMember.role !== 'leader') throw new ERR_ACCESS_REJECTED(`Only team leader can kick members`);
  }



  await dubberService.memberDelete({ id: userId, declineInvite: false });

  return {
    status: 200,
    message: `Member ${userId} has beed deleted from the team`
  };
}



export default class DubberController {
  static GetOneByQuery = GetOneByQuery;

  static PatchSettings = PatchSettings;

  static GetInviteById = GetInviteById;
  static PostInviteSend = PostInviteSend;
  static PostInviteDecline = PostInviteDecline;
  static PostInviteAccept = PostInviteAccept;

  static PatchMemberById = PatchMemberById;
  static DeleteMemberById = DeleteMemberById;
}