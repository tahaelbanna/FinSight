import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BaseCustomException } from '../custom-exceptions/base-custom.exception';
import { Response } from 'express';
import { I18nValidationException } from 'nestjs-i18n/dist/interfaces';
import { formatInputValidationErrors } from '../input-validation/format-input-validation-errors';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18nService: I18nService) {}

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof BaseCustomException) {
            return response.status(exception.statusCode).send({
                errors: exception.formatErrorResponse(),
            });
        }

        if (exception instanceof I18nValidationException) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const formatErrorResponse = formatInputValidationErrors(
                exception.errors,
                this.i18nService,
                host,
            );
            return response.status(400).send({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                errors: formatErrorResponse,
            });
        }

        return response.status(500).json({
            errors: [{ message: 'Internal Server Error' }],
        });
    }
}
