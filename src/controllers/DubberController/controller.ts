import DubberService, { ERR_DUBBER_NOT_INVITED } from '~/core/services/DubberService';
import { DocumentDTO } from '~/core/services/DTO';
import { ERR_TYPE_INVALID } from '~/services/ErrorService';
import { IDubber, TDubberMemberRole } from '~/interfaces/Dubber';



//* ===================================== GET ONE
export interface IDubberGetOneByQueryProps {
  query: string
  detailed?: boolean
}

async function GetOneByQuery({ query, detailed }: IDubberGetOneByQueryProps) {
  const dubberService = new DubberService();
  await dubberService.init(query);

  let dubber = new DocumentDTO().dubber({ object: dubberService.dubber });

  if (detailed) {
    dubber = new DocumentDTO().dubber({ object: dubberService.dubber, details: true });
  }

  return {
    status: 200,
    message: `ok${detailed ? ' + private details' : ''}`,
    dubber,
  };
}



//* ===================================== PATCH SETTINGS
export interface IDubberPatchSettingsProps {
  id: string
  nameUkr?: string
  nameEng?: string
  description?: string
  supportLinks?: Partial<IDubber['support']>
  socialLinks?: Partial<IDubber['socials']>
}

async function PatchSettings({ id, description, nameEng, nameUkr, socialLinks, supportLinks }: IDubberPatchSettingsProps) {
  const dubberService = new DubberService();
  await dubberService.init(id);

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



  // TODO: Process dubber throught public DTO
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
}

async function PostInviteSend({ dubberId, userId }: IDubberPostInviteSADProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

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
}

async function PatchMemberById({ dubberId, userId, role }: IDubberPatchMemberByIdProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

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
}

async function DeleteMemberById({ dubberId, userId }: IDubberDeleteMemberByIdProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

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