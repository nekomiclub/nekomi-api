import mongoose, { Schema } from 'mongoose';
import { IRole } from '../interfaces/Roles';

/** Roles mongodb model */
export const Role = mongoose.model<IRole>('role', new Schema({
  capabilities: Array,
  code: String,
  id: String,
  title: String
}));

export default Role; 