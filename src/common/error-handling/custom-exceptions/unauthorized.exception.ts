import { BaseCustomException } from './base-custom.exception';

export class UnauthorizedException extends BaseCustomException {
    statusCode = 401;

    constructor(message: string) {
        super(message);
    }
}
