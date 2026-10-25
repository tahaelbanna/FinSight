import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectStatus } from '../../common/enums';

export class UpdateProjectStatusDto {
    @IsNotEmpty()
    @IsEnum(ProjectStatus, {
        message: 'Status must be one of: planned, active, on_hold, completed',
    })
    status: ProjectStatus;
}