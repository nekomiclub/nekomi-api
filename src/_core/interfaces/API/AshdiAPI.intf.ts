export interface AshdiTitle {
  id: string
  url: string
  pl: string // JSON stringified AshdiDub[]
}

export interface AshdiDub {
  title: string
  folder: AshdiSeason[]
}

export interface AshdiSeason {
  title: string
  folder: AshdiEpisode[]
}

export interface AshdiEpisode {
  id: string
  title: string
  file: string
}