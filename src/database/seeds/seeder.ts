import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
    const logger = new Logger('SeederBootstrap');
    const isReset = process.argv.includes('--reset');

    logger.log(`Initializing Seeder runner (mode: ${isReset ? 'RESET & SEED' : 'SEED ONLY'})...`);

    const app = await NestFactory.createApplicationContext(SeederModule, {
        logger: ['log', 'warn', 'error'],
    });

    try {
        const seeder = app.get(SeederService);
        await seeder.run({ reset: isReset });
        logger.log('Seeder execution finished successfully.');
    } catch (error) {
        logger.error('Seeder execution failed:', error);
        process.exitCode = 1;
    } finally {
        await app.close();
        logger.log('Application context closed.');
    }
}

bootstrap();
