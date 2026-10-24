import * as Joi from 'joi';

export const envSchema = Joi.object({
    port: Joi.number().integer().default(3000),
    node_env: Joi.string().required(),
    fallbackLanguage: Joi.string().required().default('en'),
    host: Joi.string().required().default('localhost'),
    db_port: Joi.number().integer().required().default(5432),
    username: Joi.string().required().default('postgres'),
    password: Joi.string().required().default('postgres123'),
    name: Joi.string().required().default('finsight_db'),
    systemAdminName: Joi.string().required().default('Admin'),
    systemAdminEmail: Joi.string().required().email(),
    systemAdminPassword: Joi.string().required().min(8).max(20),
    jwtSecret: Joi.string().required(),
    accessTokenExpireIn: Joi.string().required(),
    refreshTokenExpireIn: Joi.string().required(),
});
