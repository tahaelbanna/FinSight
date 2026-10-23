import { BaseCustomException } from './base-custom.exception';

export class ForbiddenException extends BaseCustomException {
    statusCode = 403;

    constructor(message: string) {
        super(message);
    }
}
