import { BaseCustomException } from './base-custom.exception';

export class ConflictException extends BaseCustomException {
    statusCode = 409;

    constructor(message: string) {
        super(message);
    }
}
