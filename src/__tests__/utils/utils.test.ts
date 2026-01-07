import { describe, expect, test } from 'vitest';
import { extractAnimeContentSeason } from '~/utils/utils';



describe('Utils Tests', () => {
  test('extractAnimeContentSeason', () => {
    expect(extractAnimeContentSeason('Season 2'), 'Season 2').toBe(2.1);
    expect(extractAnimeContentSeason('Season 2 Part 2'), 'Season 2 Part 2').toBe(2.2);

    expect(extractAnimeContentSeason('2nd season'), '2nd season').toBe(2.1);
    expect(extractAnimeContentSeason('s2'), 's2').toBe(2.1);

    expect(extractAnimeContentSeason('Part ii'), 'Part ii').toBe(1.2);
    expect(extractAnimeContentSeason('Part v'), 'Part v').toBe(1.5);
  });
});