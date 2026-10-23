import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        const requestId = request.header('x-request-id') || uuidv4();
        const startTime = Date.now();
        const { method, originalUrl } = request;

        response.on('finish', () => {
            const statusCode = response.statusCode;
            const statusMessage = response.statusMessage || 'OK';
            const duration = Date.now() - startTime;
            const message = `${requestId} ${method} ${originalUrl} ${statusCode} ${statusMessage} ${duration}ms`;

            if (statusCode >= 500) return this.logger.error(message);
            if (statusCode >= 300) return this.logger.warn(message);
            this.logger.log(message);
        });

        next();
    }
}