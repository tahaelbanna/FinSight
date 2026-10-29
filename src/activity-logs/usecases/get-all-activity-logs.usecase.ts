import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/common/error-handling/custom-exceptions/unauthorized.exception';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { PaginatedResult } from 'src/common/data-access';
import { UserRepository } from 'src/users/repositories/users.repository';
import { ActivityLogRepository } from '../repositories/activity-log.repository';
import { GetActivityLogsDto } from '../dtos/get-activity-logs.dto';
import { ActivityLogResponseDto } from '../dtos/activity-log-response.dto';
import { UserRole, EntityType } from 'src/common/enums';

@Injectable()
export class GetAllActivityLogsUseCase {
    constructor(
        private readonly activityLogRepository: ActivityLogRepository,
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        query: GetActivityLogsDto,
        user_id: string,
    ): Promise<PaginatedResult<ActivityLogResponseDto>> {
        const currentUser = await this.userRepository.findById(user_id);
        if (!currentUser || currentUser.role === UserRole.EMPLOYEE) {
            throw new UnauthorizedException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        const qb = this.activityLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user');

        if (currentUser.role === UserRole.FINANCE_OFFICER) {
            qb.andWhere('log.entity_type IN (:...types)', {
                types: [EntityType.EXPENSE, EntityType.BUDGET],
            });
        } else if (currentUser.role === UserRole.MANAGER) {
            qb.andWhere('log.entity_type = :type', {
                type: EntityType.EXPENSE,
            }).innerJoin(
                'expenses',
                'expense',
                'log.entity_id = expense.expense_id AND expense.department_id = :deptId',
                { deptId: currentUser.department_id },
            );
        }

        if (query.user_id)
            qb.andWhere('log.user_id = :uid', { uid: query.user_id });
        if (query.action_type)
            qb.andWhere('log.action_type = :at', { at: query.action_type });
        if (query.entity_type)
            qb.andWhere('log.entity_type = :et', { et: query.entity_type });
        if (query.entity_id)
            qb.andWhere('log.entity_id = :eid', { eid: query.entity_id });
        if (query.date_from)
            qb.andWhere('log.created_at >= :dateFrom', {
                dateFrom: new Date(query.date_from),
            });
        if (query.date_to)
            qb.andWhere('log.created_at <= :dateTo', {
                dateTo: new Date(query.date_to),
            });

        qb.orderBy('log.created_at', 'DESC');

        const page = query.page || 1;
        const limit = query.limit || 10;
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        const formattedData = data.map((log) => ({
            log_id: log.log_id,
            user: log.user
                ? { user_id: log.user.user_id, full_name: log.user.full_name }
                : null,
            action_type: log.action_type,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            created_at: log.created_at,
        }));

        return new PaginatedResult<ActivityLogResponseDto>(
            plainToInstance(ActivityLogResponseDto, formattedData, {
                excludeExtraneousValues: true,
            }),
            total,
            page,
            limit,
        );
    }
}
