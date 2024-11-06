/** 
 * CONFIG FOR nekomi SERVICES
 * @version 1.3.1:06.11
*/

type TFKSERVICE = 'fullkekw_authority'
  | 'fullkekw_usapi'
  | 'fullkekw'

export const FULLKEKW_CONFIG: ISERVICE_CONFIG<TFKSERVICE> = {
  DATABASE: null,
  SERVICES: {
    fullkekw_authority: {
      DATABASE: null,
      host: '0.0.0.0',
      port: 45010
    },
    fullkekw_usapi: {
      DATABASE: null,
      host: '0.0.0.0',
      port: 45660
    },
    fullkekw: {
      DATABASE: null,
      host: '0.0.0.0',
      port: 0
    }
  },
  DOMAINS: {
    fullkekw: 'nekomi.club',
    fullkekw_authority: 'authority.nekomi.club',
    fullkekw_usapi: 'usapi.nekomi.club',
  }
};





export type TSERVICE = 'nekomi_site'
  | 'nekomi_api'
  | 'nekomi_bot'
  | 'nekomi_uploads'
  | 'nekomi_media'
  | 'nekomi_auth'



/** SERVICE_CONFIG.json */
export interface ISERVICE_CONFIG<TYPE extends string = TSERVICE> {
  DATABASE: Database | null

  DOMAINS: {
    [key in TYPE]: string
  }

  SERVICES: {
    [key in TYPE]: Service
  }
}



interface Service {
  DATABASE: {
    production: DatabaseCreds
    development?: DatabaseCreds

    database?: Database
  } | null

  host: string
  port: number

  port_ws?: number
}

interface Database {
  host: string
  port: number
}

interface DatabaseCreds {
  usr: string
  pwd: string
  name: string
}