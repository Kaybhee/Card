import { QueryOptions, UpdateWriteOpResult } from 'mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';

export class BaseRepository<T> {
  constructor(private readonly model: Model<T>) {}

  // Centralized CRUD databse operations for all entities, to avoid code duplication
}
