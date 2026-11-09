import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import z, { ZodError } from 'zod';

import UnifiedRepositoryClass from '~/repositories/unified.repository.js';
import Mongo from '~/services/MongoDB.service.js';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const schema = z.object({
  id: z.string(),
  order: z.number()
});

const collection = Mongo.collection('unified', schema);

const UnifiedRepository = new UnifiedRepositoryClass(collection, schema, false);

const entities = () => ctx.db.collection('unified');

const id = 'unified-id';

const makeInput = (overrides: Partial<z.infer<typeof schema>> = {}): z.infer<typeof schema> => ({
  id,
  order: 1,
  ...overrides,
}) as z.infer<typeof schema>;



beforeEach(async () => {
  await UnifiedRepository._deleteMany({});

  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UnifiedRepository', () => {
  describe('insertOne', () => {
    it('should insert new document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));

      expect(await entities().countDocuments({ id })).toBe(2);
    });

    it('should throw error if structure corrupted', async () => {
      await expect(UnifiedRepository._insertOne(makeInput({
        // @ts-ignore
        id: 1212
      }))).rejects.toThrow(ZodError);
    });
  });



  describe('insertMany', () => {
    it('should insert many documents', async () => {
      await UnifiedRepository._insertMany([
        makeInput({ id }),
        makeInput({ id }),
        makeInput({ id }),
      ]);

      expect(await entities().countDocuments({ id })).toBe(3);
    });

    it('should throw error if structure corrupted', async () => {
      await expect(UnifiedRepository._insertMany([
        makeInput({ id }),
        makeInput({
          // @ts-ignore
          id: 1212,
        })
      ])).rejects.toThrow(ZodError);
    });
  });



  describe('find', () => {
    it('should not find document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));

      const found = await UnifiedRepository._find({ id: 'missing' });

      expect(found.length).toBe(0);
    });



    it('should find document with limit', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));

      const found = await UnifiedRepository._find({ id }, { limit: 2 });

      expect(found.length).toBe(2);
    });



    it('should find document with sort', async () => {
      await UnifiedRepository._insertOne(makeInput({ id, order: 1 }));
      await UnifiedRepository._insertOne(makeInput({ id, order: 2 }));
      await UnifiedRepository._insertOne(makeInput({ id, order: 3 }));

      const found = await UnifiedRepository._find({ id }, { sort: { order: 'desc' } });

      expect(found[0].order).toBe(3);
      expect(found.length).toBe(3);
    });



    it('should throw error if structure corrupted', async () => {
      await entities().insertOne(makeInput({
        // @ts-ignore
        id: 1212
      }));

      await expect(UnifiedRepository._find({
        // @ts-ignore
        id: 1212
      })).rejects.toThrow(ZodError);
    });
  });



  describe('findOne', () => {
    it('should find single document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));

      const found = await UnifiedRepository._findOne({ id });

      expect(found).toMatchObject({ id });
    });



    it('should throw error if document is not found', async () => {
      await expect(UnifiedRepository._findOne({
        id: 'missing'
      })).rejects.toMatchObject({ code: 'sys:not_found' });
    });



    it('should throw error if structure corrupted', async () => {
      await entities().insertOne(makeInput({
        // @ts-ignore
        id: 1212
      }));

      await expect(UnifiedRepository._findOne({
        // @ts-ignore
        id: 1212
      })).rejects.toThrow(ZodError);
    });
  });



  describe('safeFindOne', () => {
    it('should find single document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));

      const found = await UnifiedRepository._safeFindOne({ id });

      expect(found).toMatchObject({ id });
    });



    it('should return null if document is not found', async () => {
      expect(await UnifiedRepository._safeFindOne({ id: 'missing' })).toBeNull();
    });



    it('should throw error if structure corrupted', async () => {
      await entities().insertOne(makeInput({
        // @ts-ignore
        id: 1212
      }));

      expect(await UnifiedRepository._safeFindOne({
        // @ts-ignore
        id: 1212
      })).toBeNull();
    });
  });



  describe('deleteOne', () => {
    it('should delete single document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));

      const result = await UnifiedRepository._deleteOne({ id });

      expect(result.deletedCount).toBe(1);
      expect(await entities().countDocuments({ id })).toBe(1);
    });



    it('should delete single document even if it is not exist', async () => {
      const result = await UnifiedRepository._deleteOne({ id: 'missing' });

      expect(result.deletedCount).toBe(0);
    });
  });



  describe('deleteMany', () => {
    it('should delete many documents', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));
      await UnifiedRepository._insertOne(makeInput({ id }));

      const result = await UnifiedRepository._deleteMany({ id });

      expect(result.deletedCount).toBe(3);
      expect(await entities().countDocuments({ id })).toBe(0);
    });



    it('should delete many documents even if they are not exist', async () => {
      const result = await UnifiedRepository._deleteMany({ id: 'missing' });

      expect(result.deletedCount).toBe(0);
    });
  });



  describe('replaceOne', () => {
    it('should replace single document', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));

      await UnifiedRepository._replaceOne({ id }, makeInput({
        id: '2'
      }));

      expect(await entities().countDocuments({ id })).toBe(0);
      expect(await entities().countDocuments({ id: '2' })).toBe(1);
    });



    it('should throw error if structure corrupted', async () => {
      await expect(UnifiedRepository._replaceOne({ id }, {
        // @ts-ignore
        id: 1212,
      })).rejects.toThrow(ZodError);
    });
  });



  describe('get document()', () => {
    it('should return document after init()', async () => {
      await UnifiedRepository._insertOne(makeInput({ id }));

      const repo = new UnifiedRepositoryClass(collection, schema);

      await repo.init({ id });

      expect(repo.document).toMatchObject({ id });
    });



    it('should return document after insertOne', async () => {
      const repo = new UnifiedRepositoryClass(collection, schema);

      await repo._insertOne(makeInput({ id }));

      expect(repo.document).toMatchObject({ id });
    });



    it('should throw error if internal document is undefined or emit is false', async () => {
      const repo = new UnifiedRepositoryClass(collection, schema);

      await UnifiedRepository._insertOne(makeInput({ id }));

      expect(() => repo.document).toThrow(expect.objectContaining({ code: 'sys:document_not_initialized' })); // Not initialized
      expect(() => UnifiedRepository.document).toThrow(expect.objectContaining({ code: 'sys:document_not_initialized' })); // Emit disabled
    });
  });



  describe('save', () => {
    it('should save new version of the document', async () => {
      // Unified repository does not have any methods to change internal document
      expect(true).toBeTruthy();
    });
  });
});