export interface IAshdiTitle {
  id: string
  url: string
  pl: IAshdiDub[]
}

export interface IAshdiDub {
  title: string // {DUBBER_NAME}
  folder: IAshdiSeason[]
}

export interface IAshdiSeason {
  title: string // Сезон {N}
  folder: IAshdiEpisode[]
}

export interface IAshdiEpisode {
  id: string
  title: string // Серія {N}
  file: string
}