import { BaseCustomException } from './base-custom.exception';

export class NotFoundException extends BaseCustomException {
    statusCode = 404;

    constructor(message: string) {
        super(message);
    }
}
