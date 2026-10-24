import { Expose } from 'class-transformer';

export class SystemAdminResponseDto {
    @Expose()
    admin_id: string;

    @Expose()
    name: string;

    @Expose()
    email: string;


    @Expose()
    password_hash: string;

    @Expose()
    is_super_admin: boolean;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    deleted_at: Date | null;
}
