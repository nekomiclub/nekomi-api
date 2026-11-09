import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const ctx = vi.hoisted(() => ({
  mongod: undefined as unknown as MongoMemoryServer,
  client: undefined as unknown as MongoClient,
  db: undefined as unknown as Db,
}));

vi.mock('~/services/MongoDB.service.js', async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const { MongoClient } = await import('mongodb');

  ctx.mongod = await MongoMemoryServer.create();
  ctx.client = await MongoClient.connect(ctx.mongod.getUri());
  ctx.db = ctx.client.db('test');

  return {
    default: {
      // Same call shape as the real service: collection(name, schema)
      collection: (name: string) => ctx.db.collection(name),
    },
  };
});

vi.mock('~/repositories/AnimeRepository.js', () => ({
  default: { safeGetOne: vi.fn() },
}));



// Imports after mocks
import { ZodError } from 'zod';

import { ICreateFeedEntitySchema } from '~/domain/feed.schema.js';
import AnimeRepository from '~/repositories/AnimeRepository.js';
import FeedRepository, { FeedRepositoryClass } from '~/repositories/feed.repository.js';



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entities = () => ctx.db.collection('feeds');

const anime_id = 'anime-1';

const makeInput = (overrides: Partial<ICreateFeedEntitySchema> = {}): ICreateFeedEntitySchema => ({
  anime_id,
  cover_url: 'https://example.com',
  video_url: 'https://example.com',
  ...overrides,
}) as ICreateFeedEntitySchema;

const animeExists = () => vi.mocked(AnimeRepository.safeGetOne).mockResolvedValue({} as never);
const animeMissing = () => vi.mocked(AnimeRepository.safeGetOne).mockResolvedValue(null as never);



beforeEach(async () => {
  await FeedRepository.deleteMany();

  vi.clearAllMocks();

  animeExists(); // default: the refferenced anime exists
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeedRepository', () => {
  describe('insertOne', () => {
    it('should store new document', async () => {
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
      await FeedRepository.insertOne(makeInput({ anime_id }));

      await expect(FeedRepository.insertOne(makeInput({ anime_id })))
        .rejects.toThrow(expect.objectContaining({ code: 'sys:already_exist' }));
    });



    it('should ensure that refferenced anime exists', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id }));

      expect(AnimeRepository.safeGetOne).toHaveBeenCalledWith(anime_id);
    });
  });



  describe('get document()', () => {
    it('insertOne should emit _doc when called from new instance', async () => {
      const repo = new FeedRepositoryClass();
      await repo.insertOne(makeInput({ anime_id }));

      expect(repo.document).toMatchObject({ anime_id });
    });



    it('insertOne should not emit _doc when called from general instance', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id }));

      expect(() => FeedRepository.document)
        .toThrow(expect.objectContaining({ code: 'sys:document_not_initialized' }));
    });
  });



  describe('findOne', () => {
    it('should find specified entity among several', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-1' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-2' }));

      const found = await FeedRepository.findOne('anime-2');

      expect(found.anime_id).toBe('anime-2');

      expect(
        // @ts-ignore
        found._id
      ).toBeUndefined();
    });



    it('should throw validation error if document has invalid structure', async () => {
      await entities().insertOne({ anime_id: 1212 });

      await expect(FeedRepository.findOne(
        // @ts-ignore
        1212
      )).rejects.toThrow(ZodError);
    });



    it('should throw 404 if entity is not exist', async () => {
      await expect(FeedRepository.findOne('missing')).rejects.toMatchObject({ code: 'sys:not_found' });
    });
  });



  describe('findMany', () => {
    it('should find each document', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-1' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-2' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-3' }));

      const response = await FeedRepository.findMany();

      expect(response.length).toBe(3);
    });
  });



  describe('safeFindOne', () => {
    it('should return document if it is exist', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id }));

      const found = await FeedRepository.safeFindOne(anime_id);

      expect(found).toMatchObject({ anime_id });
    });



    it('should return null if document has invalid structure', async () => {
      await entities().insertOne({ anime_id: 1212 });

      const found = await FeedRepository.safeFindOne('1212');

      expect(found).toBeNull();
    });



    it('should return null if it is not exist', async () => {
      const found = await FeedRepository.safeFindOne('missing');

      expect(found).toBeNull();
    });
  });



  describe('deleteOne', () => {
    it('should delete single document', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-1' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-2' }));

      await FeedRepository.deleteOne('anime-2');

      expect(await entities().countDocuments({ anime_id: 'anime-1' })).toBe(1);
      expect(await entities().countDocuments({ anime_id: 'anime-2' })).toBe(0);
    });
  });



  describe('deleteMany', () => {
    it('should delete many documents with matching anime_id', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-1' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-2' }));
      await entities().insertOne(makeInput({ anime_id: 'anime-2' }));  // Implicitly create second record with same id


      const response = await FeedRepository.deleteMany('anime-2');

      expect(await entities().countDocuments({ anime_id: 'anime-1' })).toBe(1);
      expect(await entities().countDocuments({ anime_id: 'anime-2' })).toBe(0);

      expect(response.deletedCount).toBe(2);
    });



    it('should delete many documents', async () => {
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-1' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-2' }));
      await FeedRepository.insertOne(makeInput({ anime_id: 'anime-3' }));

      const response = await FeedRepository.deleteMany();

      expect(await entities().countDocuments()).toBe(0);

      expect(response.deletedCount).toBe(3);
    });
  });
});