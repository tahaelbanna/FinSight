export interface EnvironmentInterface {
    port: number;
    fallbackLanguage: string;
    database: IDB;
    systemAdmin: ISystemAdmin;
    jwt: IJWT;
    cloudinary: ICloudinaryConfig;
}
export interface IDB {
    host: string;
    db_port: number;
    username: string;
    password: string;
    name: string;
}
export interface ISystemAdmin {
    name: string;
    email: string;
    password: string;
}
export interface IJWT {
    jwtSecret: string;
    accessTokenExpireIn: string;
    refreshTokenExpireIn: string;
}

export interface ICloudinaryConfig {
    cloudinaryCloudName: string;
    cloudinaryApiKey: string;
    cloudinaryApiSecret: string;
}