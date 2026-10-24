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
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentInterface } from './common/configuration/environment.interface';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RefreshToken } from './auth/schemas/refresh-token.schema';
import { Department } from './departments/schemas/departments.schema';
import { User } from './users/schemas/users.schema';
import { SystemAdmin } from './system-admin/schemas/system-admin.schema';

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
                    path: path.join(process.cwd(), 'src/i18n/'),
                    watch: process.env.node_env === 'development',
                },
            }),
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-lang']),
            ],
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (
                configService: ConfigService<EnvironmentInterface>,
            ) => {
                const isDev = process.env.node_env === 'development';
                return {
                    type: 'postgres',
                    host: configService.getOrThrow<string>('database.host', {
                        infer: true,
                    }),
                    port: configService.getOrThrow<number>('database.db_port', {
                        infer: true,
                    }),
                    username: configService.getOrThrow<string>(
                        'database.username',
                        { infer: true },
                    ),
                    password: configService.getOrThrow<string>(
                        'database.password',
                        { infer: true },
                    ),
                    database: configService.getOrThrow<string>(
                        'database.name',
                        {
                            infer: true,
                        },
                    ),
                    entities: [SystemAdmin, User, Department, RefreshToken],
                    autoLoadEntities: true,
                    synchronize: isDev,
                    logging: false,
                };
            },
        }),
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: CustomExceptionFilter,
        },
        { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    ],
})
export class CoreModule {}
