import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { CreateUserDto } from '../dtos/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from '../dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserRepository } from '../repositories/users.repository';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CreateUserUsecase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(body: CreateUserDto): Promise<UserResponseDto> {
        const normalizedEmail = body.email.toLowerCase();
        const existingUser = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            throw new BadRequestException(
                this.i18nService.translate('users.USER_ALREADY_EXISTS'),
            );
        }
        const hashedPassword = await bcrypt.hash(body.password_hash, 10);
        const createdUser = await this.userRepository.create({
            ...body,
            email: normalizedEmail,
            password_hash: hashedPassword,
        });

        return plainToInstance(UserResponseDto, createdUser);
    }
}
