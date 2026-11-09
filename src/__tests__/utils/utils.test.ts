import '~/services/openapi/setup.js';

import { describe, expect, test } from 'vitest';

import { getContentSeason } from '~/algorithms/AnimeUpdateCrawler.js';
import { extractAnimeContentSeason } from '~/utils/utils.js';



describe('Utils Tests', () => {
  test('extractAnimeContentSeason', () => {
    expect(extractAnimeContentSeason('Season 2'), 'Season 2').toBe(2.1);
    expect(extractAnimeContentSeason('Season 2 Part 2'), 'Season 2 Part 2').toBe(2.2);

    expect(extractAnimeContentSeason('2nd season'), '2nd season').toBe(2.1);
    expect(extractAnimeContentSeason('4th season'), '4th season').toBe(4.1);
    expect(extractAnimeContentSeason('s2'), 's2').toBe(2.1);

    expect(extractAnimeContentSeason('Part ii'), 'Part ii').toBe(1.2);
    expect(extractAnimeContentSeason('Part v'), 'Part v').toBe(1.5);
  });

  test('getContentSeason', () => {
    expect(getContentSeason(['Dr. Stone: Science Future Part 3']), 's1 p3').toBe(1.3);
    expect(getContentSeason(['Dr. Stone: Science Future Part 3', 'Dr. Stone 4th Season Part 3']), 's4 p3').toBe(4.3);
  });
});