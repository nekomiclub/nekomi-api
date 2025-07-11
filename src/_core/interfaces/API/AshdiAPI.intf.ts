export interface AshdiTitle {
  id: string
  url: string
  pl: AshdiDub[]
}

export interface AshdiDub {
  title: string // {DUBBER_NAME}
  folder: AshdiSeason[]
}

export interface AshdiSeason {
  title: string // Сезон {N}
  folder: AshdiEpisode[]
}

export interface AshdiEpisode {
  id: string
  title: string // Серія {N}
  file: string
}