import { EnvironmentInterface } from '../environment.interface';
import { defaultEnv } from './default.env';

export const developmentEnv = (): EnvironmentInterface => ({
    ...defaultEnv(),
    port: 4000,
});
