export interface IAshdiTitle {
  id: string
  url: string
  pl: AshdiPlType[]
}

export interface IAshdiDubber {
  title: string // {DUBBER_NAME}
  folder: IAshdiSeason[]
}

/** MOVIE ONLY */
export interface IAshdiMovieDubber {
  title2: string // {DUBBER_NAME}
  url: string // vod/{id}
}

export type AshdiPlType = IAshdiDubber | IAshdiMovieDubber

export interface IAshdiSeason {
  title: string // " Сезон {N}"
  folder: IAshdiEpisode[]
}

export interface IAshdiEpisode {
  id: string
  title: string // "Серія {N}"
  file: string
}