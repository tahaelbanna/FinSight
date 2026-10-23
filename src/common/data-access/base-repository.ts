import {
    DeepPartial,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    In,
    ObjectLiteral,
    QueryRunner,
    Repository,
    UpdateResult,
    DeleteResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export interface BaseTransactionalOptions {
    queryRunner?: QueryRunner;
}

export interface FindPaginatedOptions<T> extends FindManyOptions<T> {
    page?: number;
    limit?: number;
    ignoreLimit?: boolean;
    queryRunner?: QueryRunner;
}

export class PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };

    constructor(
        data: T[],
        total: number,
        page: number = 1,
        limit: number = 10,
    ) {
        this.data = data;
        this.meta = {
            page,
            limit,
            total,
            totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        };
    }
}

export class BaseRepository<T extends ObjectLiteral> {
    constructor(protected readonly repository: Repository<T>) {}

    protected getRepo(queryRunner?: QueryRunner): Repository<T> {
        return queryRunner ? queryRunner.manager.getRepository(this.repository.target) : this.repository;
    }

    async create(
        entityLike: DeepPartial<T>,
        options?: BaseTransactionalOptions,
    ): Promise<T> {
        const repo = this.getRepo(options?.queryRunner);
        const entity = repo.create(entityLike);
        return (await repo.save(entity)) as T;
    }

    async createMany(
        entitiesLike: DeepPartial<T>[],
        options?: BaseTransactionalOptions,
    ): Promise<T[]> {
        const repo = this.getRepo(options?.queryRunner);
        const entities = repo.create(entitiesLike);
        return (await repo.save(entities)) as T[];
    }

    async findById(
        id: any,
        options?: FindOneOptions<T> & BaseTransactionalOptions,
    ): Promise<T | null> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.findOne({
            ...options,
            where: { id } as unknown as FindOptionsWhere<T>,
        });
    }

    async findOne(
        options: FindOneOptions<T> & BaseTransactionalOptions,
    ): Promise<T | null> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.findOne(options);
    }

    async find(
        options?: FindManyOptions<T> & BaseTransactionalOptions,
    ): Promise<T[]> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.find(options);
    }

    async count(
        options?: FindManyOptions<T> & BaseTransactionalOptions,
    ): Promise<number> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.count(options);
    }

    async findPaginated(
        options: FindPaginatedOptions<T> = {},
    ): Promise<PaginatedResult<T>> {
        const repo = this.getRepo(options.queryRunner);
        const page = Math.max(1, options.page || 1);
        const limit = options.ignoreLimit ? undefined : Math.max(1, options.limit || 10);
        const skip = limit && !options.ignoreLimit ? (page - 1) * limit : undefined;

        const findOptions: FindManyOptions<T> = {
            ...options,
            skip,
            take: limit,
        };

        const [data, total] = await repo.findAndCount(findOptions);

        return new PaginatedResult<T>(
            data,
            total,
            page,
            limit || total,
        );
    }

    async update(
        criteria: FindOptionsWhere<T>,
        partialEntity: QueryDeepPartialEntity<T>,
        options?: BaseTransactionalOptions,
    ): Promise<UpdateResult> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.update(criteria, partialEntity);
    }

    async updateById(
        id: any,
        partialEntity: QueryDeepPartialEntity<T>,
        options?: BaseTransactionalOptions,
    ): Promise<T | null> {
        const repo = this.getRepo(options?.queryRunner);
        await repo.update(id, partialEntity);
        return this.findById(id, options);
    }

    async delete(
        criteria: FindOptionsWhere<T>,
        options?: BaseTransactionalOptions,
    ): Promise<DeleteResult> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.delete(criteria);
    }

    async deleteById(
        id: any,
        options?: BaseTransactionalOptions,
    ): Promise<DeleteResult> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.delete(id);
    }

    async softDelete(
        criteria: FindOptionsWhere<T>,
        options?: BaseTransactionalOptions,
    ): Promise<UpdateResult> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.softDelete(criteria);
    }

    async restore(
        criteria: FindOptionsWhere<T>,
        options?: BaseTransactionalOptions,
    ): Promise<UpdateResult> {
        const repo = this.getRepo(options?.queryRunner);
        return repo.restore(criteria);
    }
}