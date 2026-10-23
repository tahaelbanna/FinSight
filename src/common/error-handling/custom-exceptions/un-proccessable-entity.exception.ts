import { BaseCustomException } from './base-custom.exception';
import { HttpStatus } from '@nestjs/common';

export class UnprocessableEntityException extends BaseCustomException {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;

    constructor(message: string) {
        super(message);
    }
}
