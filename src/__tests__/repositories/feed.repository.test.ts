import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';


// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('~/services/MongoDB.service.js', async () => {
  const { createMongoServiceMock } = await import('../_helpers/mongo.js');
  return createMongoServiceMock();
});

vi.mock('~/repositories/AnimeRepository.js', () => ({
  default: { safeGetOne: vi.fn() },
}));

// Imports after mocks
import { ZodError } from 'zod';

import { clearDb, getDb, stopMongo } from '~/__tests__/_helpers/mongo.js';
import { ICreateFeedEntitySchema } from '~/domain/feed.schema.js';
import AnimeRepository from '~/repositories/AnimeRepository.js';
import FeedRepository from '~/repositories/feed.repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entities = () => getDb().collection('feeds');

const anime_id = 'anime-1';

const makeInput = (overrides: Partial<ICreateFeedEntitySchema> = {}): ICreateFeedEntitySchema => ({
  anime_id,
  cover_url: 'https://example.com',
  video_url: 'https://example.com',
  ...overrides,
}) as ICreateFeedEntitySchema;

const animeExists = () => vi.mocked(AnimeRepository.safeGetOne).mockResolvedValue({} as never);
const animeMissing = () => vi.mocked(AnimeRepository.safeGetOne).mockResolvedValue(null as never);


beforeEach(clearDb);
afterAll(stopMongo);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeedRepository', () => {
  /**
   * This test suites cover only FeedRepository features (like insertOne)
   * Test suites for CRUD operations (like find or delete) are described inside UnifiedRepository
   * 
   * @see unified.repositories.test.ts
   */

  describe('insertOne', () => {
    it('should store new document', async () => {
      animeExists();

      const result = await FeedRepository.insertOne(makeInput({ anime_id }));

      expect(result).toMatchObject({ anime_id });
      expect(await entities()?.countDocuments({ anime_id })).toBe(1);
    });



    it('should ensure that payload is valid', async () => {
      await expect(FeedRepository.insertOne(
        // @ts-ignore
        1
      )).rejects.toThrow(ZodError);
    });



    it('should ensure that refferenced anime is unique inside feed collection', async () => {
      animeExists();

      await FeedRepository.insertOne(makeInput({ anime_id }));

      await expect(FeedRepository.insertOne(makeInput({ anime_id })))
        .rejects.toThrow(expect.objectContaining({ code: 'sys:already_exist' }));
    });



    it('should ensure that refferenced anime exists', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id }));

      expect(AnimeRepository.safeGetOne).toHaveBeenCalledWith(anime_id);
    });
  });
});