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
