export interface IUserSettings {
  notCreated?: undefined
}

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

interface IUserStatsWatchedTitles {
  title: string,
  dubs: IUserStatsWatchedTitlesDub[]
}

interface IUserStatsWatchedTitlesDub {
  id: string,
  totalWatch: number
}

export type TUserRoles = 'root' | 'admin' | 'moderator' | 'dubber' | 'subber' | 'subscriber' | 'editor' | 'user'