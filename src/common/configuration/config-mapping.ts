import { EnvironmentInterface } from './environment.interface';
import { defaultEnv } from './Environment-modes/default.env';
import { productionEnv } from './Environment-modes/production.env';
import { developmentEnv } from './Environment-modes/development.env';

const environment: Record<string, () => EnvironmentInterface> = {
    default: defaultEnv,
    development: developmentEnv,
    production: productionEnv,
};

export default () => {
    const nodeEnv = process.env.node_env || 'development';
    const getEnvToLoad = environment[nodeEnv] || developmentEnv;
    console.log(`Loading configuration for environment: ${nodeEnv}`);
    return getEnvToLoad();
};
