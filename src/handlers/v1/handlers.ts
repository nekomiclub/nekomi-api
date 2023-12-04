import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Dubbers from '../../Models/Dubber';
import Storage from '../../Models/Storage';
import Title from '../../Models/Title';

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;
}

export function createInitArchitecture() {
  const root = path.resolve();
  const tmp = `${root}/tmp`;
  const processing = `${tmp}/processing`;
  const uploads = `${tmp}/uploads`;

  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
  if (!fs.existsSync(processing)) fs.mkdirSync(processing);
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
}

export async function clearTestIDs() {
  await Dubbers.deleteMany({ id: { $regex: /^testid-/g } });
  await Title.deleteMany({ id: { $regex: /^testid-/g } });
  await Storage.deleteMany({ id: { $regex: /^testid-/g } });

  return true;
}