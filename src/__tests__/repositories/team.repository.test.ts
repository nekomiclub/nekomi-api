import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('~/services/MongoDB.service.js', async () => {
  const { createMongoServiceMock } = await import('../_helpers/mongo.js');
  return createMongoServiceMock();
});

// Imports after mocks

import { clearDb, getDb, stopMongo } from '~/__tests__/_helpers/mongo.js';
import conf from '~/conf.js';
import TeamEntity, { ICreateTeamEntity } from '~/domain/team.schema.js';
import TeamRepository, { TeamRepositoryClass, TeamRepositoryValidators } from '~/repositories/team.repository.js';
import { getUTC } from '~/utils/utils.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entities = () => getDb().collection('teams');

const id = 'team-1';

const makeEntity = (overrides: Partial<TeamEntity> = {}): TeamEntity => ({
  id,
  name: 'team 123',
  slug: 'team-123',
  about: 'Some about text',
  avatar: conf.variables.default_avatar_url,
  cover: conf.variables.default_team_cover_url,
  members: [],
  socials: {
    tiktok: 'https://example.com'
  },
  support: {
    patreon: 'https://example.com'
  },
  created_at: getUTC().ISO,
  updated_at: getUTC().ISO,
  ...overrides,
}) satisfies TeamEntity;

const makeInput = (overrides: Partial<ICreateTeamEntity> = {}): ICreateTeamEntity => ({
  name: 'name',
  ...overrides,
}) satisfies ICreateTeamEntity;

beforeEach(clearDb);
afterAll(stopMongo);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TeamRepository', () => {
  /**
   * This test suites cover only TeamRepository features (like insertOne, setName)
   * Test suites for CRUD operations (like find or delete) are described inside UnifiedRepository
   * 
   * @see unified.repositories.test.ts
   */

  describe('insertOne', () => {
    it('should store new document', async () => {
      const name = 'супер адмін';

      const result = await TeamRepository.insertOne(makeInput({ name }));

      expect(await TeamRepository.findOneById(result.id)).toMatchObject({
        name,
        slug: 'super-admin',
        avatar: conf.variables.default_avatar_url,
        cover: conf.variables.default_team_cover_url,
        about: null,
      });
    });



    it('should store new document with optional inputs', async () => {
      const result = await TeamRepository.insertOne(makeInput({
        avatar: 'https://example.com',
        about: 'Some about text',
        socials: {
          instagram: 'https://example.com'
        }
      }));

      expect(await TeamRepository.findOneById(result.id)).toMatchObject({
        avatar: 'https://example.com',
        cover: conf.variables.default_team_cover_url,
        about: 'Some about text',
        socials: {
          instagram: 'https://example.com'
        }
      });
    });



    it('should change slug if it reserved', async () => {
      const name = 'супер адмін';

      const result1 = await TeamRepository.insertOne(makeInput({ name }));
      const result2 = await TeamRepository.insertOne(makeInput({ name }));

      expect(result1.slug).toBe('super-admin');
      expect(result2.slug).not.toBe('super-admin');
    });



    it('should throw error if input structure corrupted', async () => {
      await expect(TeamRepository.insertOne({
        name: 'name',
        // @ts-ignore
        about: 1212
      })).rejects.toThrow(ZodError);

      await expect(TeamRepository.insertOne({
        name: 'name',
        // @ts-ignore
        cover: 'not url text'
      })).rejects.toThrow(ZodError);

      await expect(TeamRepository.insertOne({
        name: 'name',
        socials: {
          telegram: 'not url text'
        }
      })).rejects.toThrow(ZodError);
    });
  });



  describe('findOneById', () => {
    it('should find one by id', async () => {
      await entities().insertOne(makeEntity({ id: '1', slug: '2' }));
      await entities().insertOne(makeEntity({ id: '2', slug: '3' }));
      await entities().insertOne(makeEntity({ id: '3', slug: '1' }));

      expect(await TeamRepository.findOneById('2')).toMatchObject({ id: '2', slug: '3' });
    });
  });



  describe('findOneBySlug', () => {
    it('should find one by slug', async () => {
      await entities().insertOne(makeEntity({ slug: '2', id: '1' }));
      await entities().insertOne(makeEntity({ slug: '3', id: '2' }));
      await entities().insertOne(makeEntity({ slug: '1', id: '3' }));

      expect(await TeamRepository.findOneBySlug('3')).toMatchObject({ slug: '3', id: '2' });
    });
  });



  describe('findOneByQuery', () => {
    it('should find one by query', async () => {
      await entities().insertOne(makeEntity({ slug: '2', id: '1' }));
      await entities().insertOne(makeEntity({ slug: '3', id: '2' }));
      await entities().insertOne(makeEntity({ slug: '1', id: '3' }));

      // Get first matching document (matched by id)
      expect(await TeamRepository.findOneByQuery('1')).toMatchObject({ id: '1', slug: '2', });

      // Get first matching document (matched by slug)
      expect(await TeamRepository.findOneByQuery('2')).toMatchObject({ id: '1', slug: '2', });
    });
  });



  describe('setName', () => {
    it('should set name & update slug', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      await repo.setName('супер адмін');

      expect(repo.document.name).toBe('супер адмін');
      expect(repo.document.slug).toBe('super-admin');
    });



    it('should modify slug if it is reserved', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput({ name: 'супер адмін' }));
      await repo.insertOne(makeInput({ name: 'any name' }));

      await repo.setName('супер адмін');

      expect(repo.document.name).toBe('супер адмін');
      expect(repo.document.slug).not.toBe('super-admin');
    });



    it('should throw error if input corrupted or invalid', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      // Invalid type
      await expect(repo.setName(
        // @ts-ignore
        1212
      )).rejects.toThrow(ZodError);

      // Invalid schema
      await expect(repo.setName('a'.repeat(TeamRepositoryValidators.limits.NAME_MAX_LENGTH + 1)))
        .rejects.toThrow(ZodError);
    });
  });



  describe('setAbout', () => {
    it('should set about text', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      repo.setAbout('Some text');

      expect(repo.document.about).toBe('Some text');
    });



    it('should assert empty string as null', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      repo.setAbout('');

      expect(repo.document.about).toBeNull();
    });



    it('should throw error if input corrupted or invalid', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      // Invalid type
      expect(() => repo.setAbout(
        // @ts-ignore
        1212
      )).toThrow(ZodError);

      // Invalid schema
      expect(() => repo.setAbout('a'.repeat(TeamRepositoryValidators.limits.ABOUT_TEXT_MAX_LENGTH + 1)))
        .toThrow(ZodError);
    });
  });



  describe('setSocialLink', () => {
    it('should set link', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      repo.setSocialLink('instagram', 'https://example.com');

      expect(repo.document.socials.instagram).toBe('https://example.com');

      repo.setSocialLink('instagram', undefined);

      expect(repo.document.socials.instagram).toBeUndefined();
    });



    it('should throw error if input corrupted or invalid', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      // Invalid type
      expect(() => repo.setSocialLink('instagram',
        // @ts-ignore
        1212
      )).toThrow(ZodError);

      // Invalid schema
      expect(() => repo.setSocialLink('instagram', 'a'.repeat(TeamRepositoryValidators.limits.LINK_MAX_LENGTH + 1)))
        .toThrow(ZodError);

      // TODO: Add invalid domain check (set instagram but url target to youtube)
    });
  });



  describe('setSupportLink', () => {
    it('should set link', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      repo.setSupportLink('diaka', 'https://example.com');

      expect(repo.document.support.diaka).toBe('https://example.com');

      repo.setSupportLink('diaka', undefined);

      expect(repo.document.support.diaka).toBeUndefined();
    });



    it('should throw error if input corrupted or invalid', async () => {
      const repo = new TeamRepositoryClass();

      await repo.insertOne(makeInput());

      // Invalid type
      expect(() => repo.setSupportLink('diaka',
        // @ts-ignore
        1212
      )).toThrow(ZodError);

      // Invalid schema
      expect(() => repo.setSupportLink('diaka', 'a'.repeat(TeamRepositoryValidators.limits.LINK_MAX_LENGTH + 1)))
        .toThrow(ZodError);

      // TODO: Add invalid domain check (set diaka but url target to youtube)
    });
  });



  describe('uploadAvatar', () => {
    it('NOT COVERED', () => expect(true).toBeTruthy());
  });



  describe('uploadCover', () => {
    it('NOT COVERED', () => expect(true).toBeTruthy());
  });
});