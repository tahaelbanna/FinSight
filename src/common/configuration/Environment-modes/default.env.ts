/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { EnvironmentInterface } from '../environment.interface';

export const defaultEnv = (): EnvironmentInterface => ({
    port: Number(process.env.PORT),
    fallbackLanguage: process.env.fallbackLanguage as string,
});
