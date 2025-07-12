import nstatsInit from 'nstats';

interface Nstats {
  interval: number
  serverName: string

  express(): any
  toPrometheus(): any
  toJson(): any
}

export default function nstats(): Nstats {
  return nstatsInit();
}