import { BaseCustomException } from './base-custom.exception';

export class BadRequestException extends BaseCustomException {
    statusCode = 400;

    constructor(message: string) {
        super(message);
    }
}
