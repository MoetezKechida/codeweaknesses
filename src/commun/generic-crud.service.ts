// src/common/services/base.service.ts
import { Repository, DeepPartial, FindOptionsWhere, UpdateResult } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TimestampEntity } from './entities/timestamp.entity';

export abstract class BaseService<T extends TimestampEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  create(addDto: DeepPartial<T>): Promise<T> {
        return this.repository.save(addDto);
    }

  async findAll(): Promise<T[]> {
    return this.repository.find({withDeleted: false}); 
  }

  async findOne(id: string): Promise<T> {
    
    const entity = await this.repository.findOne({ 
      where: { id } as any,
        withDeleted: false
    });
    
    if (!entity) {
      throw new NotFoundException();
    }
    return entity;
  }

  async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
  const existingEntity = await this.findOne(id); 
  const mergedEntity = this.repository.merge(existingEntity, updateDto);
  return this.repository.save(mergedEntity);
}

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.softDelete(id); 
  }

  async restore(id: string): Promise<UpdateResult> {
        const result = await this.repository.restore(id);
        if (!result.affected) throw new NotFoundException('Entity not found');
        return result;
    }
}