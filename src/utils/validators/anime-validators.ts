import z from 'zod';

import { getUTC } from '~/utils/utils.js';



const l = {
  MAX_TITLE_LENGTH: 256,
  MAX_TITLE_SYNONIMS: 20,

  MAX_SYNOPSIS_LENGTH: 5000,

  MAX_SCORE: 10,

  MAX_SCORED_BY: 999999999,

  MIN_YEAR: 1980,
  MAX_YEAR: getUTC().year + 3,

  MAX_EPISODES_TOTAL: 99999,
};



const AnimeValidators = {
  limits: l,



  title: z.string().max(l.MAX_TITLE_LENGTH),

  titleSynonims: z.array(z.string().max(l.MAX_TITLE_LENGTH)).max(l.MAX_TITLE_SYNONIMS),

  synopsis: z.string().max(l.MAX_SYNOPSIS_LENGTH),

  score: z.number().min(0).max(l.MAX_SCORE),

  scoredBy: z.number().min(0).max(l.MAX_SCORED_BY),

  year: z.number().min(l.MIN_YEAR).max(l.MAX_YEAR),

  episodes: z.number().min(0).max(l.MAX_EPISODES_TOTAL)
};



export default AnimeValidators;