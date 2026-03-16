export interface IAshdiTitle {
  id: string
  url: string
  pl: AshdiPlType[]
}

export interface IAshdiTeam {
  title: string // {TEAM_NAME}
  folder: IAshdiSeason[]
}

/** MOVIE ONLY */
export interface IAshdiMovieTeam {
  title2: string // {TEAM_NAME}
  url: string // vod/{id}
}

export type AshdiPlType = IAshdiTeam | IAshdiMovieTeam

export interface IAshdiSeason {
  title: string // " Сезон {N}"
  folder: IAshdiEpisode[]
}

export interface IAshdiEpisode {
  id: string
  title: string // "Серія {N}"
  file: string
}