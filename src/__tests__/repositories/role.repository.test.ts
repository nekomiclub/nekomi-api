import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';


// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('~/services/MongoDB.service.js', async () => {
  const { createMongoServiceMock } = await import('../_helpers/mongo.js');
  return createMongoServiceMock();
});

// Imports after mocks
import { ZodError } from 'zod';

import { clearDb, getDb, stopMongo } from '~/__tests__/_helpers/mongo.js';
import RoleEntity, { ICreateRoleEntity, ROLE_PERMISSION_ENUM } from '~/domain/role.schema.js';
import RoleRepository, { RoleRepositoryClass } from '~/repositories/role.repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const entities = () => getDb().collection('roles');

const makeEntity = (overrides: Partial<RoleEntity> = {}): RoleEntity => ({
  id: '1',
  slug: 'name-123',
  name: 'name 123',
  permissions: [],
  ...overrides,
}) as RoleEntity;

const makeInput = (overrides: Partial<ICreateRoleEntity> = {}): ICreateRoleEntity => ({
  name: 'name',
  ...overrides,
}) as ICreateRoleEntity;

beforeEach(clearDb);
afterAll(stopMongo);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RoleRepository', () => {
  /**
   * This test suites cover only RoleRepository features (like insertOne, appendPermission)
   * Test suites for CRUD operations (like find or delete) are described inside UnifiedRepository
   * 
   * @see unified.repositories.test.ts
   */

  describe('insertOne', () => {
    it('should store new document & transliterate name', async () => {
      const name = 'супер адмін';

      const result = await RoleRepository.insertOne(makeInput({ name }));

      // New role must include basic permission
      expect(result.permissions).includes(ROLE_PERMISSION_ENUM.enum.BASIC);

      expect(result).toMatchObject({ name, slug: 'super-admin' });
      expect(await entities()?.countDocuments({ name })).toBe(1);
    });



    it('should ensure that payload is valid', async () => {
      await expect(RoleRepository.insertOne(
        // @ts-ignore
        1
      )).rejects.toThrow(ZodError);
    });



    it('should modify slug if it is already exist', async () => {
      const name = 'супер адмін';

      await RoleRepository.insertOne(makeInput({ name }));
      const result = await RoleRepository.insertOne(makeInput({ name }));

      expect(result.slug).not.toBe('super-admin');
    });
  });



  describe('findOneById', () => {
    it('should find one by id', async () => {
      await entities().insertOne(makeEntity({ id: '1', slug: '2' }));
      await entities().insertOne(makeEntity({ id: '2', slug: '3' }));
      await entities().insertOne(makeEntity({ id: '3', slug: '1' }));

      expect(await RoleRepository.findOneById('2')).toMatchObject({ id: '2', slug: '3' });
    });
  });



  describe('findOneBySlug', () => {
    it('should find one by slug', async () => {
      await entities().insertOne(makeEntity({ slug: '2', id: '1' }));
      await entities().insertOne(makeEntity({ slug: '3', id: '2' }));
      await entities().insertOne(makeEntity({ slug: '1', id: '3' }));

      expect(await RoleRepository.findOneBySlug('3')).toMatchObject({ slug: '3', id: '2' });
    });
  });



  describe('findOneByQuery', () => {
    it('should find one by query', async () => {
      await entities().insertOne(makeEntity({ slug: '2', id: '1' }));
      await entities().insertOne(makeEntity({ slug: '3', id: '2' }));
      await entities().insertOne(makeEntity({ slug: '1', id: '3' }));

      // Get first matching document (matched by id)
      expect(await RoleRepository.findOneByQuery('1')).toMatchObject({ id: '1', slug: '2', });

      // Get first matching document (matched by slug)
      expect(await RoleRepository.findOneByQuery('2')).toMatchObject({ id: '1', slug: '2', });
    });
  });



  describe('appendPermission', () => {
    it('should append new permission', async () => {
      const repo = new RoleRepositoryClass();

      const result = await repo.insertOne(makeInput());

      repo.appendPermission(ROLE_PERMISSION_ENUM.enum.ABSOLUTE);

      // Internal document should include added permission
      expect(repo.document.permissions).includes(ROLE_PERMISSION_ENUM.enum.ABSOLUTE);

      await repo._save();

      // Internal document should replace database document
      expect((await repo.findOneById(result.id)).permissions).includes(ROLE_PERMISSION_ENUM.enum.ABSOLUTE);
    });



    it('should not append permission if it is already in', async () => {
      const repo = new RoleRepositoryClass();

      await repo.insertOne(makeInput());

      repo.appendPermission(ROLE_PERMISSION_ENUM.enum.BASIC);

      // Permissions length should not change
      expect(repo.document.permissions.length).toBe(1);
    });



    it('should throw error if document is not initialized', async () => {
      expect(() => RoleRepository.appendPermission(ROLE_PERMISSION_ENUM.enum.BASIC))
        .toThrow(expect.objectContaining({ code: 'sys:document_not_initialized' }));
    });



    it('should throw error if permission is not valid', async () => {
      const repo = new RoleRepositoryClass();

      await repo.insertOne(makeInput());

      expect(() => repo.appendPermission(
        // @ts-ignore
        '111'
      )).toThrow(ZodError);
    });
  });



  describe('revokePermission', () => {
    it('should revoke permission', async () => {
      const repo = new RoleRepositoryClass();

      await repo.insertOne(makeInput());

      repo.appendPermission(ROLE_PERMISSION_ENUM.enum.ABSOLUTE);

      // Permission should be added
      expect(repo.document.permissions.length).toBe(2);

      repo.revokePermission(ROLE_PERMISSION_ENUM.enum.ABSOLUTE);

      // Permission should be removed
      expect(repo.document.permissions.length).toBe(1);
    });



    it('should throw error or basic permission revoke', async () => {
      const repo = new RoleRepositoryClass();

      await repo.insertOne(makeInput());

      expect(() => repo.revokePermission(ROLE_PERMISSION_ENUM.enum.BASIC))
        .toThrow(expect.objectContaining({ code: 'sys:action_prevented' }));
    });
  });
});