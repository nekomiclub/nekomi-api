import CacheService from '~/services/CacheService';
import DubberService, { ERR_DUBBER_NOT_INVITED } from '~/core/Services/DubberService';
import Search from '~/services/SearchService';
import TitleModel from '~/Models/Title';
import UserModel from '~/Models/User';
import { DocumentDTO, MongoDocumentDTO } from '~/core/Services/DTO';
import { E500, ERR_ACCESS_REJECTED, ERR_TYPE_INVALID } from '~/services/ErrorService';
import { IDubber, IDubberMember, TDubberMemberRole } from '~/core/Interfaces/IDubber';
import { IEXPRESS_REQ_NEKOMI_USER } from '~/interfaces/globals';
import { ITitle } from '~/interfaces/ITitle';
import { IUser } from '~/interfaces/IUser';
import { getUTC } from '~/handlers/handler';



export const DubberDubbedAnimeCache = new CacheService<ITitle[]>('DubberDubbedAnimeCache');
export const DubberParsedMembersCache = new CacheService<IUser[]>('DubberParsedMembersCache');



//* ===================================== GET ONE
export interface IDubberGetOneByQueryProps {
  query: string
  detailed?: boolean
  fetchDubbedAnime?: boolean
  parseMembers?: boolean

  /** Fetch only dubber metadata, will set dubber to null */
  metadataOnly?: boolean

  /** Use cache
   * @default true
   */
  useCache?: boolean
}

interface IDubberMetadata {
  title: string
  description: string
  keywords: string[]
  photo: string
}

async function GetOneByQuery({ query, detailed, fetchDubbedAnime, parseMembers, useCache, metadataOnly }: IDubberGetOneByQueryProps) {
  const dubberService = new DubberService();
  await dubberService.init(query);

  useCache = useCache ?? true;

  let dubber: IDubber = new DocumentDTO().dubber({ object: dubberService.dubber });
  let dubbedAnime: ITitle[] | undefined = undefined;
  let parsedMembers: IUser[] | undefined = undefined;
  let metadata: IDubberMetadata | undefined = undefined;



  if (detailed) {
    dubber = new DocumentDTO().dubber({ object: dubberService.dubber, details: true });
  }

  // Fetch dubbed anime's
  if (detailed && fetchDubbedAnime) {
    const cached = DubberDubbedAnimeCache.get({ id: dubberService.dubber.id });

    if (cached && useCache) {
      dubbedAnime = cached;
    } else {
      const titles = (await TitleModel.find()).map(el => new MongoDocumentDTO().anime({ document: el, details: true }));
      const withDubbing = titles.filter(title => {
        return title.episodes?.some(ep => ep.dubberID === dubberService.dubber.id);
      });

      dubbedAnime = withDubbing.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8).map(el => new DocumentDTO().anime({ object: el }));

      DubberDubbedAnimeCache.push({
        id: dubberService.dubber.id,
        createdAt: getUTC().timestamp,
        data: dubbedAnime
      });
    }
  }

  // Parse members
  if (detailed && parseMembers) {
    const cached = DubberParsedMembersCache.get({ id: dubberService.dubber.id });

    if (cached && useCache) {
      parsedMembers = cached;
    } else {
      const users = (await UserModel.find({ id: { $in: dubberService.dubber.members.map(el => el.id) } })).map(el => new MongoDocumentDTO().user({ document: el, details: true }));

      parsedMembers = users;

      DubberParsedMembersCache.push({
        id: dubberService.dubber.id,
        createdAt: getUTC().timestamp,
        data: parsedMembers
      });
    }
  }

  // Send only metadata
  if (metadataOnly) {
    metadata = {
      title: dubber.nameUkr,
      description: dubber.description ?? 'Ця команда озвучує аніме на nekomi.club',
      keywords: [dubber.nameUkr, dubber.nameEng],
      photo: dubber.avatar
    };

    // @ts-ignore
    dubber = null;
  }

  return {
    status: 200,
    message: `ok${detailed ? ' + private details' : ''}`,
    dubber,
    dubbedAnime,
    parsedMembers,
    metadata
  };
}



//* ===================================== GET SEARCH
export interface IDubberGetSearch {
  /** Query ~all will return all dubbers */
  q: string
}

export interface IDubberGetSearchResult {
  dubber: IDubber
}

async function GetSearch({ q }: IDubberGetSearch) {
  const limit = 15;

  let dubberResults: IDubber[] = [];

  if (q === '~all') {
    // Get all
    dubberResults = (await new DubberService().getAll()).slice(0, limit);
  } else {
    dubberResults = Search.search({ query: q, engine: 'dubber', limit });
  }

  const results: IDubberGetSearchResult[] = [];

  dubberResults.forEach(dubber => {
    results.push({
      dubber: new DocumentDTO().dubber({ object: dubber, details: false })
    });
  });

  return {
    status: 200,
    message: 'ok',
    results
  };
}



//* ===================================== PUT AVATAR
export interface IDubberPutAvatarProps {
  file: Express.Multer.File
  dubberId: string
  currentUser: IEXPRESS_REQ_NEKOMI_USER
}

async function PutAvatar({ currentUser, dubberId, file }: IDubberPutAvatarProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

  //* Ensure access
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });

  const { url } = await dubberService.changeAvatar({ file, userId: currentUser.id });

  return {
    status: 201,
    message: 'Dubber avatar uploaded',
    url
  };
}



//* ===================================== PUT BANNER
export interface IDubberPutBannerProps {
  file: Express.Multer.File
  dubberId: string
  currentUser: IEXPRESS_REQ_NEKOMI_USER
}

async function PutBanner({ currentUser, dubberId, file }: IDubberPutBannerProps) {
  const dubberService = new DubberService();
  await dubberService.init(dubberId);

  //* Ensure access
  const currentMember = dubberService.dubber.members.find(el => el.id === currentUser.id);
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });

  const { url } = await dubberService.changeBanner({ file, userId: currentUser.id });

  return {
    status: 201,
    message: 'Dubber banner uploaded',
    url
  };
}



//* ===================================== PATCH SETTINGS
export interface IDubberPatchSettingsProps {
  dubberId: string
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
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });



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
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });



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

  Search.update('user');
  DubberParsedMembersCache.purge({ id: dubberService.dubber.id });

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

  Search.update('user');

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
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });



  if (typeof role === 'string') await dubberService.memberEdit({ id: userId, role });

  await dubberService.save();
  DubberParsedMembersCache.purge({ id: dubberService.dubber.id });

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
  ensureAccess({ role: 'leader', user: currentUser, member: currentMember });



  await dubberService.memberDelete({ id: userId, declineInvite: false });

  Search.update('user');
  DubberParsedMembersCache.purge({ id: dubberService.dubber.id });

  return {
    status: 200,
    message: `Member ${userId} has beed deleted from the team`
  };
}



function ensureAccess({ role, user, member }: { role: TDubberMemberRole, user: IEXPRESS_REQ_NEKOMI_USER, member?: IDubberMember }) {
  // Pass root or admin
  if (!user.capabilities.includes('root') && !user.capabilities.includes('admin')) {
    // Only team member can edit settings
    if (!member) throw new ERR_ACCESS_REJECTED(`Can not edit settings of the team what you don't belong to`);
    // Only leader can edit settings
    if (member.role !== role) throw new ERR_ACCESS_REJECTED();
  }
}



export default class DubberController {
  static GetOneByQuery = GetOneByQuery;
  static GetSearch = GetSearch;
  static PutAvatar = PutAvatar;
  static PutBanner = PutBanner;

  static PatchSettings = PatchSettings;

  static GetInviteById = GetInviteById;
  static PostInviteSend = PostInviteSend;
  static PostInviteDecline = PostInviteDecline;
  static PostInviteAccept = PostInviteAccept;

  static PatchMemberById = PatchMemberById;
  static DeleteMemberById = DeleteMemberById;
}