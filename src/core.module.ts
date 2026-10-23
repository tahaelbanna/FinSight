import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import {
    AcceptLanguageResolver,
    HeaderResolver,
    I18nModule,
    QueryResolver,
} from 'nestjs-i18n';
import * as path from 'node:path';
import { envSchema } from './common/configuration/env-valdiation-schema';
import configMapping from './common/configuration/config-mapping';
import { CustomExceptionFilter } from './common/error-handling/filters/custom-exception.filter';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envSchema,
            load: [configMapping],
        }),
        I18nModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                fallbackLanguage: configService.get<string>(
                    'fallbackLanguage',
                    'en',
                ),
                loaderOptions: {
                    path: path.join(__dirname, '../../i18n/'),
                    watch:
                        configService.get<string>('NODE_ENV') === 'development',
                },
            }),
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-lang']),
            ],
        }),
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: CustomExceptionFilter,
        },
    ],
})
export class CoreModule {}
