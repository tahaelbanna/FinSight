import { ErrorResponseInterface } from '../error-response.interface';

export abstract class BaseCustomException extends Error {
    abstract statusCode: number;

    protected constructor(message: string) {
        super(message);
    }

    formatErrorResponse(): ErrorResponseInterface[] {
        return [
            {
                message: this.message,
            },
        ];
    }
}
