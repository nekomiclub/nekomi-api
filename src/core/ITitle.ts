export interface ITitleEpisodesDub {
  id: string,
  includeSub: boolean,
  include2K: boolean,
  eps: ITitleEpisodeDubbed[]
}

export interface ITitleEpisodeDubbed {
  order: number,
  source: {
    q240: string | null,
    q480: string | null,
    q720: string | null,
    q1080: string | null,
    q2k: string | null
  },
  subIDs: string[] | null,
  framesURL: string[] | null
}

export interface ITitleEpisodeMeta {
  order: number,
  names: {
    ukr: string,
    eng: string
  },
  dateOut: number
}