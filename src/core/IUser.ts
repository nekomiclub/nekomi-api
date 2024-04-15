/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
export interface IUserSettings {
  notCreated?: undefined
}

/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
export interface IUserList {
  titles: string[],
  createdAt: number,
  immortal: boolean,
  hidden: boolean,
  thumb: string,
  description: string,
  name: string,
  id: string
}

/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
export interface IUserStats {
  createdAt: number,
  titles: {
    watched: number,
    favorites: number,
    plans: number,
    delayed: number,
    threwn: number
  },
  player: {
    totalWatched: number,
    popularDub: string | null,
    watchedTitles: IUserStatsWatchedTitles[] | null
  }
}

/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
interface IUserStatsWatchedTitles {
  title: string,
  dubs: IUserStatsWatchedTitlesDub[]
}

/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
interface IUserStatsWatchedTitlesDub {
  id: string,
  totalWatch: number
}

/** @deprecated use new IUser interface from interfaces/User.ts/IUser */
export type TUserRoles = 'root' | 'admin' | 'moderator' | 'dubber' | 'subber' | 'subscriber' | 'editor' | 'user'