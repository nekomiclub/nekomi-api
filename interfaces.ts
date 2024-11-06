export interface IANIMEE_CONFIG {
  SERVICES: {
    DB: {
      PORT: number,
      HOST: number,
    },

    ANIMEE_CORE: IANIMEE_CONFIG_SERVICE,
    ANIMEE_MEDIA: IANIMEE_CONFIG_SERVICE,
    ANIMEE_BOT: IANIMEE_CONFIG_SERVICE,
    ANIMEE_UPLOADS: IANIMEE_CONFIG_SERVICE,
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