import z from 'zod';
import { getUTC } from '~/utils/utils';



const l = {
  MAX_TITLE_LENGTH: 256,
  MAX_TITLE_SYNONIMS: 10,

  MAX_SYNOPSIS_LENGTH: 2200,

  MIN_SCORE: 0,
  MAX_SCORE: 10,

  MIN_SCORED_BY: 0,
  MAX_SCORED_BY: 999999999,

  MIN_YEAR: 1980,
  MAX_YEAR: getUTC().year + 3,

  MIN_EPISODES_TOTAL: 0,
  MAX_EPISODES_TOTAL: 99999,
};

const AnimeValidators = {
  limits: l,

  title: z.string().max(l.MAX_TITLE_LENGTH),
  titleSynonims: z.array(z.string().max(l.MAX_TITLE_LENGTH)).max(l.MAX_TITLE_SYNONIMS),
  synopsis: z.string().max(l.MAX_SYNOPSIS_LENGTH),
  score: z.number().min(l.MIN_SCORE).max(l.MAX_SCORE),
  scoredBy: z.number().min(l.MIN_SCORED_BY).max(l.MAX_SCORED_BY),
  year: z.number().min(l.MIN_YEAR).max(l.MAX_YEAR),
  episodes: z.number().min(l.MIN_EPISODES_TOTAL).max(l.MAX_EPISODES_TOTAL)
};



export default AnimeValidators;