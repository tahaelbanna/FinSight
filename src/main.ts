import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { I18nValidationPipe } from 'nestjs-i18n';
import { EnvironmentInterface } from './common/configuration/environment.interface';
import { ConfigService } from '@nestjs/config';
import { ConsoleLogger } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create<INestApplication>(AppModule, {
        logger: new ConsoleLogger({
            json: process.env.node_env === 'production',
        }),
    });

    const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
    ];

    if (process.env.FRONTEND_URL) {
        const customOrigins = process.env.FRONTEND_URL.split(',').map((u) => u.trim());
        allowedOrigins.push(...customOrigins);
    }

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // In non-production, permit any localhost / 127.0.0.1 port
            if (
                process.env.node_env !== 'production' &&
                /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
            ) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400,
    });

    app.setGlobalPrefix('api/v1');
    
	app.useGlobalPipes(
        new I18nValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    const logger = new Logger('Bootstrap');

    logger.log('Application initialized.');

	const configService = app.get(ConfigService<EnvironmentInterface>);
    
	const port = configService.getOrThrow<number>('port');
    
	await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);

}
void bootstrap();
