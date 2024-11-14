/** 
 * CONFIG FOR nekomi SERVICES
 * @version 1.3.2:14.11
*/







export type TSERVICE = 'nekomi_site'
  | 'nekomi_api'
  | 'nekomi_bot'
  | 'nekomi_uploads'
  | 'nekomi_media'
  | 'nekomi_auth'



/** SERVICE_CONFIG.json */
export interface ISERVICE_CONFIG {
  DATABASE: Database

  DOMAINS: {
    [key in TSERVICE]: string
  }

  SERVICES: {
    [key in TSERVICE]: Service
  }
}



interface Service {
  DATABASE: {
    production: DatabaseCreds
    development?: DatabaseCreds
  }

  CREDS: {
    [key: string]: string
  }

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