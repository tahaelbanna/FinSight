import * as Joi from 'joi';

export const envSchema = Joi.object({
    PORT: Joi.number().integer().default(3000),
    NODE_ENV: Joi.string().required(),
    fallbackLanguage: Joi.string().required().default('en'),
});
