export interface IDubber {
  id: string,
  code: string,
  name: string,
  thumbURL: string,
  socials: {
    telegram: string | null,
    instagram: string | null,
    youtube: string | null,
    tiktok: string | null
  },
  support: {
    diaka: string | null,
    monobank: string | null,
    privatbank: string | null,
    bymeacoffee: string | null,
    patreon: string | null
  },
  createdAt: number,
  description: string | null,
  leader: string | null,
  editors: string[] | null,
  members: string[] | null,
  rating: number
}

export interface IStat {
  timestamp: number,
  online: {
    min: number,
    max: number,
    total: number,
    avg: number
  },
  titles: {
    id: string,
    dubs: {
      id: string
      watchtime: number
    }[],
    totalWatchtime: number
  }[],
  seriesUploaded: number,
  titlesUpdated: number
}

export interface IStatTitle {
  id: string,
  watchtimeS: number,
  dubs: {
    id: string,
    watchtimeS: number
  }[]
}

export interface IStatRecord {
  title: string,
  selectedDub: string,
  watchtime: number
}



export interface IANIMEE_CONFIG {
  SERVICES: {
    DB: {
      PORT: number,
      HOST: number,
    },

    ANIMEE_CORE: IANIMEE_CONFIG_SERVICE,
    ANIMEE_MEDIA: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS_BOT: IANIMEE_CONFIG_SERVICE,
  }
}

interface IANIMEE_CONFIG_SERVICE {
  HOST: string,
  PORTS: {
    HTTP: number,
    HTTPS: number | null,
    WS: number | null
  },
  DB: {
    DEV: {
      DB_NAME: string,
      USR: string,
      PWD: string
    },
    PROD: {
      DB_NAME: string,
      USR: string,
      PWD: string
    }
  } | null
}