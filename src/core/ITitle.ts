export interface ITitleEpisodesDub {
  id: string,
  includeSub: boolean,
  include2K: boolean,
  eps: ITitleEpisodeDubbed[]
}

export interface ITitleEpisodeDubbed {
  order: number,
  source: {
    q240: string,
    q480: string,
    q720: string,
    q1080: string,
    q2k: string | null
  },
  subIDs: string[] | null,
  framesURL: string[] | null
}

export interface ITitleEpisodeMeta {
  titleID: string,
  order: number,
  names: {
    ukr: string,
    eng: string
  },
  dateOut: number
}