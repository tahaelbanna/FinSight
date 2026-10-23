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
});
