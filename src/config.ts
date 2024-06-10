import fs from 'fs';
import path from 'path';
import ip from 'ip';

import { IANIMEE_CONFIG } from './core/interfaces';


const ANIMEE_CONFIG = JSON.parse(fs.readFileSync(`${path.resolve()}/../CONFIG.json`).toString()) as IANIMEE_CONFIG;

export const devMode = process.argv.includes('devMode');
export const prodMode = process.argv.includes('prodMode');

/** Test mode. In test mode some validation will pass in other ways */
export const testMode = process.argv.includes('testMode');

/** Main service config */
export const config = {
  /** DB object from global config */
  db: ANIMEE_CONFIG.SERVICES.DB,

  /** Current service object in global config */
  service: ANIMEE_CONFIG.SERVICES.ANIMEE_CORE,

  /** All service objects in global config */
  services: ANIMEE_CONFIG.SERVICES,

  /** Secrets */
  secrets: {
    /* CSRF Token */
    CSRF: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC85cKOiEx6bn86\nozMx7ir6hv0IpJ/Y4UqgyufBY1Cd1IK4lnvrhVp78uku+YBbKgx4GNcITnc0sNnf\nl/ETxPjQiwTZeQ52Imh4NMi4QPoQP340YhZ1v7mj5CwUyVdcSd/0MhS+InzXEb3T\neYSecKG9fXCFWPQJ4dZiVx7wAFb07/SyVky5pWQI3IVaiCb0Zkji2Gmx7/Rj9SON\nidme7LkHMJMPtsRTUKghxk1BIr0G1F9YG+JMr1Su2/yD9k3f0Qcg7YJkZSOyZTpC\nasyP6BQccCJWSVXCqfGmPK/SXheUjRUI2C/zFsBnMIQ0qENwuO4wHeX1oQ3PvdVs\nnz4wM8ABAgMBAAECggEAEE3CZ5vzAeQ0ngKFAiu80OfCwjK3SzhSwSMSMrpYNG8p\nozX11yOo5ibWooPNZNDxx5HZSXHATy9udqJ+H8cx9InzLrQIoACjRLDFnEWbb7iT\nM4E90AbuxmsEtPyVyjTkHAcQjEKcxNFWsYB9BlHRW/IOOqwtUAcKgm1jkbJtzvEa\n2PXDwOu4g9zC0Va/wTWCS5uvPkVq74h2uN8g23+pNnRv9pj6C27N+2wLqgydSjTu\nydFf4TNLlqLv1UmtU5ou9IrV0xYRQQcMhtyLiWbxL8YLO/QaLTB+21L7ofx+KIMW\nxotka6Z5dA6o4mg7rHOKk4VJzgJtD30+eAOIOtbPiwKBgQD2Qcl6KMubw9GPsYza\n0vCFQ6N1t0q4WeuqyGiw/YzKW1NxyaX4PeaXfyo7sbWc6hEfL8sJj1aAEGOXIIga\nYabSn0zQ/R3/BcoW5c7DLSHti0zjnMn93vOHL41T4q+mtdCvSvVdFUJDaeTtvl1J\n6nNNFB6MTSQkfRO3TJyCwA6wwwKBgQDEXwH2WzLrkSGOwyM13abvuF77RH+pSx9A\ndE5cWqim3WQ6Un3W0FXWsfNjrQ6z3TX6oV9pIX6KLFoY8CLXigtnl5CE9sWw4NHU\nXllDefgznTA7zjub/TUc1Q3zGSeFcH/rkAhMcwbVLC1V6+9TA2CIpRECNPURPnc/\n/R3xknK/6wKBgHWulLEbQ8opd0E7MTv1qFmXLEt6D2wwFK5l3ZoPYTPnFuZ+3iDW\nvBbT/4PNdiQJu6rytQ3ZgRXsPxuewUwSNJ3c4OHSxH3171Cn+/pL3DXf5xuy9tiq\nriiBcgGPiC+cHaFXqhAUs7jxpyRyX7SOJRHFtp+H0ejaGQz0wKq/S4XvAoGAGwn5\n+zITkNwrAr1b287pbZi1e2OzMFxnsThSkeTp1BAn/N/e8/U73JQkL1Vk8N9Ez33o\n5VD3W48/2K84HPWlHF6CR8yy6+gI/HUBVYk14+WA/rsm+hOjfJTZlt+f0X/sHUN3\n4Q71oeSzWWFjUsrkP+x6qxMfq4Aua2Eu/lRr+IECgYEAsae1mmfX2rIXqKnuIsuB\nHVRQFRJ8cbATpWFg/RQvAzNYjhe+RLJQ9akpNKZ4wFxQJCAGo39Tq8juZ6BogCvb\nlqsAvWbA2b1IrAi3N673iIjgcdRmFJmFhcYdIEebvuwK3/8iVwalz8ABunY4YhoV\n0wQp+TnlrRNuhF5GjHF3Tbs=\n-----END PRIVATE KEY-----\n`
  },

  /** Microservices local URLs */
  microservices: {
    /** Animee uploads URL */
    uploadsURL: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS.PORTS.HTTP}`,

    /** Animee uploads bot URL */
    uploadsBotURL: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_UPLOADS_BOT.PORTS.HTTP}`,

    /** Animee media URL */
    media: `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,

    /** Fullkekw user api url
     * This service is out of ANIMEE CONFIG, so it's IP will be same with local machine
     */
    usapi: `http://${getIP('0.0.0.0')}:45660`
  },

  /** URLs */
  URL: {
    /** Animee client URL */
    client: prodMode ? `https://animee.club` : `http://${getIP('0.0.0.0')}:3001`,

    /** Animee updater URL */
    updater: prodMode ? `https://updater.animee.club` : `http://${getIP('0.0.0.0')}:3000`,

    /** Media URL */
    media: prodMode ? `https://media.animee.club` : `http://${getIP(ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.HOST)}:${ANIMEE_CONFIG.SERVICES.ANIMEE_MEDIA.PORTS.HTTP}`,

    /** Fullkekw authority service URL */
    fullkekw_authority: prodMode ? `https://authority.animee.club` : `http://${getIP('0.0.0.0')}:45010`
  },

  /** Tests data */
  tests: {
    /** Tests data for DevController */
    DevController: {
      $1: {
        /** Dummy user with correct role */
        dummyRightID: 'dummy-devcontroller-1',

        /** Dummy user with root role */
        dummyRootID: 'dummy-devcontroller-0',

        /** Dummy user without required role */
        dummyID: 'dummy-devcontroller-2',
      }
    },
    UserController: {
      $1: {
        /** Dummy user for PATCH /user */
        dummyUser: 'dummy-usercontroller-0',

        /** Required for this test title id */
        titleId: '0fc90fe6-8dcf-4eaa-8080-f0d933e76266',
      }
    }
  },

  /** Service variables */
  vars: {
    /** Animee cookie with fullkekw usapi session */
    sessionCookieName: 'SEC_31N',

    /** Production mode will run only at this IP */
    prodIP: '192.168.0.107',

    /** CSRF token expiration */
    CSRF_EXPIRE: prodMode ? 5000 : 180000
  }
};

//! CHANGE HTTP PORT TO DEFAULT. IN PROD MODE THIS WILL BE MANAGED BY NGINX.
if (devMode) {
  config.service.PORTS.HTTP = 80;
}

/** Change IP to current if it match 0.0.0.0 */
function getIP(raw: string): string {
  if (raw === '0.0.0.0') {
    return ip.address();
  } else {
    return raw;
  }
}