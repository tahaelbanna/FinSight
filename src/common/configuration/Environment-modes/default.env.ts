/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { EnvironmentInterface } from '../environment.interface';

export const defaultEnv = (): EnvironmentInterface => ({
    port: Number(process.env.port),
    fallbackLanguage: process.env.fallbackLanguage as string,
    database: {
        host: process.env.host as string,
        db_port: Number(process.env.db_port),
        username: process.env.username as string,
        password: process.env.password as string,
        name: process.env.name as string,
    },
    systemAdmin: {
        name: process.env.systemAdminName as string,
        email: process.env.systemAdminEmail as string,
        password: process.env.systemAdminPassword as string,
    },
    jwt: {
        jwtSecret: process.env.jwtSecret as string,
        accessTokenExpireIn: process.env.accessTokenExpireIn as string,
        refreshTokenExpireIn: process.env.refreshTokenExpireIn as string,
    },
});
